import prisma from '../config/database.js';
import { randomUUID } from 'crypto';

const JOB_STATUSES = ['ACTIVE', 'CLOSED', 'REJECTED'];

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

// POST /api/job-requirements
export const createJobRequirement = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const {
      title, company, city, localities, description,
      contactEmail, contactPhone,
      jobType, category, role, experienceMin, experienceMax,
      salaryMin, salaryMax, remoteWork, showContact, termsAccepted
    } = req.body;

    if (!title || !city || !description || !contactEmail || !contactPhone) {
      return res.status(400).json({ success: false, error: 'Title, city, description, email and phone are required.' });
    }
    if (!role) {
      return res.status(400).json({ success: false, error: 'Role is required.' });
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
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
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
        status: 'ACTIVE',
      },
      include: { customer: { select: { name: true, phone: true } } }
    });

    return res.status(201).json({ success: true, job, message: 'Job posted successfully!' });
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

// GET /api/job-requirements  — public listing (all active jobs, paginated)
export const getAllJobRequirements = async (req, res) => {
  try {
    const { city, category, role, jobType, page = 1, limit = 20 } = req.query;
    const where = buildJobFilter({ city, category, role, jobType, status: 'ACTIVE' });

    const jobs = await prisma.jobRequirement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: { customer: { select: { name: true } } }
    });
    const total = await prisma.jobRequirement.count({ where });
    return res.json({ success: true, jobs, total });
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
    const where = buildJobFilter({ city, category, role, jobType, status, search });

    const jobs = await prisma.jobRequirement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: { customer: { select: { name: true, phone: true, email: true, customerNo: true } } }
    });
    const total = await prisma.jobRequirement.count({ where });
    return res.json({ success: true, jobs, total });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// PATCH /api/job-requirements/admin/:id/status — admin changes status (ACTIVE/CLOSED/REJECTED)
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
    return res.status(500).json({ success: false, error: err.message });
  }
};
