import prisma from '../config/database.js';
import { randomUUID } from 'crypto';
import { isPhoneVerified } from './auth.controller.js';

const JOB_STATUSES = ['PENDING', 'ACTIVE', 'CLOSED', 'REJECTED'];

// Normalises the free-form numbers coming from the posting form
const toInt = (value, fallback = 0) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const toFloatOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

// Candidates must reach the recruiter through the platform, so a description
// carrying an Indian mobile number (plain, +91 prefixed or space separated) is refused.
const MOBILE_NUMBER_PATTERN = /(?:\+?91[\s-]?)?[6-9]\d{9}/;
const containsMobileNumber = (text) =>
  MOBILE_NUMBER_PATTERN.test(String(text || '').replace(/[\s\-().]/g, ''));

// POST /api/job-requirements
export const createJobRequirement = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const {
      title, company, city, localities, description,
      contactEmail, contactPhone, whatsappNumber, alternateMobile, phoneSameAsWhatsapp,
      jobType, category, role, experienceMin, experienceMax,
      salaryMin, salaryMax, remoteWork, showContact, termsAccepted
    } = req.body;

    // Email is no longer collected on the form; the column stays for old rows.
    if (!title || !city || !description || !contactPhone) {
      return res.status(400).json({ success: false, error: 'Title, city, description and phone are required.' });
    }
    if (containsMobileNumber(description)) {
      return res.status(400).json({ success: false, error: 'Mobile numbers are not allowed in the job description.' });
    }
    const whatsapp = phoneSameAsWhatsapp
      ? String(contactPhone).trim()
      : String(whatsappNumber || '').trim();
    if (!role) {
      return res.status(400).json({ success: false, error: 'Role is required.' });
    }
    // The form verifies the recruiter number; enforcing it here keeps fake
    // postings out even when the request skips the UI.
    if (!isPhoneVerified(contactPhone)) {
      return res.status(403).json({ success: false, error: 'Please verify the phone number with the OTP before posting.' });
    }

    const job = await prisma.jobRequirement.create({
      data: {
        id: randomUUID(),
        customerId,
        title: title.trim().slice(0, 150),
        company: company?.trim().slice(0, 50) || null,
        city: city.trim(),
        localities: Array.isArray(localities) ? localities.slice(0, 5) : [],
        description: description.trim().slice(0, 3000),
        contactName: null,
        contactEmail: contactEmail ? String(contactEmail).trim().slice(0, 100) : '',
        contactPhone: contactPhone.trim(),
        whatsappNumber: whatsapp || null,
        alternateMobile: alternateMobile ? String(alternateMobile).trim() : null,
        jobType: jobType || 'Full Time Jobs',
        category: category || 'Other',
        role: role.trim(),
        experienceMin: toInt(experienceMin, 0),
        experienceMax: toInt(experienceMax, 0),
        salaryMin: toFloatOrNull(salaryMin),
        salaryMax: toFloatOrNull(salaryMax),
        remoteWork: remoteWork || 'No',
        showContact: showContact === undefined ? true : Boolean(showContact),
        termsAccepted: Boolean(termsAccepted),
        status: 'PENDING',
      },
      include: { customer: { select: { name: true, phone: true } } }
    });

    return res.status(201).json({ success: true, job, message: 'Job submitted for admin approval!' });
  } catch (err) {
    console.error('[JobRequirement] create error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/job-requirements/mine  — fetch jobs posted by the logged-in customer
export const getMyJobRequirements = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const jobs = await prisma.jobRequirement.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Builds the shared filter used by the public board and the admin board
const buildJobFilter = ({ city, category, role, jobType, status, search }) => {
  const where = {};
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (category) where.category = category;
  if (role) where.role = { contains: role, mode: 'insensitive' };
  if (jobType) where.jobType = jobType;
  if (status) where.status = status;
  if (search) where.title = { contains: search, mode: 'insensitive' };
  return where;
};

// GET /api/job-requirements  — public listing (all approved & active jobs, paginated)
export const getAllJobRequirements = async (req, res) => {
  try {
    const { city, category, role, jobType, search, page = 1, limit = 20 } = req.query;
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const where = buildJobFilter({ city, category, role, jobType, search, status: 'ACTIVE' });

    const [rawJobs, total] = await Promise.all([
      prisma.jobRequirement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: { customer: { select: { name: true } } }
      }),
      prisma.jobRequirement.count({ where }),
    ]);

    const jobs = rawJobs.map(job => (
      job.showContact === false
        ? { ...job, contactPhone: null, whatsappNumber: null, alternateMobile: null }
        : job
    ));

    return res.json({ success: true, jobs, total, page: safePage, limit: safeLimit });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/job-requirements/:id  — customer closes own job posting
export const deleteJobRequirement = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const { id } = req.params;
    const job = await prisma.jobRequirement.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    if (job.customerId !== customerId) return res.status(403).json({ success: false, error: 'Forbidden' });
    if (job.status === 'REJECTED') {
      return res.status(400).json({ success: false, error: 'Rejected jobs cannot be closed.' });
    }

    await prisma.jobRequirement.update({ where: { id }, data: { status: 'CLOSED' } });
    return res.json({ success: true, message: 'Job closed.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

// GET /api/job-requirements/admin/all — admin sees every job (any status, filters)
export const adminGetAllJobs = async (req, res) => {
  try {
    const { city, category, role, jobType, status, search, page = 1, limit = 50 } = req.query;
    const baseWhere = buildJobFilter({ city, category, role, jobType, search });
    const where = status ? { ...baseWhere, status } : baseWhere;

    const [jobs, total, groupedCounts] = await Promise.all([
      prisma.jobRequirement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: { customer: { select: { name: true, phone: true, email: true, customerNo: true } } }
      }),
      prisma.jobRequirement.count({ where }),
      prisma.jobRequirement.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
      }),
    ]);

    const countMap = groupedCounts.reduce((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

    const counts = {
      total: Object.values(countMap).reduce((sum, n) => sum + n, 0),
      pending: countMap.PENDING || 0,
      active: countMap.ACTIVE || 0,
      closed: countMap.CLOSED || 0,
      rejected: countMap.REJECTED || 0,
    };

    return res.json({ success: true, jobs, total, counts });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// PATCH /api/job-requirements/admin/:id/status — admin changes status (PENDING/ACTIVE/CLOSED/REJECTED)
export const adminUpdateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!JOB_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const job = await prisma.jobRequirement.update({
      where: { id },
      data: { status },
      include: { customer: { select: { name: true, phone: true } } }
    });
    return res.json({ success: true, job });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/job-requirements/admin/:id — admin hard-deletes
export const adminDeleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.jobRequirement.delete({ where: { id } });
    return res.json({ success: true, message: 'Job deleted.' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
};
