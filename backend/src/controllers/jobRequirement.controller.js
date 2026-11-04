import prisma from '../config/database.js';
import { randomUUID } from 'crypto';

// POST /api/job-requirements  — customer posts a new job requirement
export const createJobRequirement = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const {
      title, company, city, localities, description,
      contactName, contactEmail, contactPhone,
      jobType, role, remote, experienceMin, experienceMax,
      salaryMin, salaryMax, termsAccepted, showContact
    } = req.body;

    if (!title || !city || !description || !contactName || !contactPhone || !contactEmail) {
      return res.status(400).json({ success: false, error: 'Title, city, description, contact name, phone and email are required.' });
    }
    if (!termsAccepted) {
      return res.status(400).json({ success: false, error: 'You must accept the terms and conditions.' });
    }

    const job = await prisma.jobRequirement.create({
      data: {
        id: randomUUID(),
        customerId,
        title: title.trim(),
        company: company?.trim() || null,
        city: city.trim(),
        localities: Array.isArray(localities) ? localities.slice(0, 5) : [],
        description: description.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone.trim(),
        jobType: jobType || 'Full Time',
        role: role?.trim() || '',
        remote: remote || 'No',
        experienceMin: experienceMin ? parseInt(experienceMin) : 0,
        experienceMax: experienceMax ? parseInt(experienceMax) : 0,
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        termsAccepted: Boolean(termsAccepted),
        showContact: showContact !== false,
        status: 'ACTIVE',
      },
      include: { customer: { select: { name: true, phone: true } } }
    });

    return res.status(201).json({ success: true, job, message: 'Job posted successfully!' });
  } catch (err) {
    console.error('[JobRequirement] createJobRequirement error:', err);
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

// GET /api/job-requirements  — public listing (all active jobs, paginated)
export const getAllJobRequirements = async (req, res) => {
  try {
    const { city, category, page = 1, limit = 20 } = req.query;
    const where = { status: 'ACTIVE' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (category) where.category = category;

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
    const { city, category, status, page = 1, limit = 50 } = req.query;
    const where = {};
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (category) where.category = category;
    if (status) where.status = status;

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
    if (!['ACTIVE', 'CLOSED', 'REJECTED'].includes(status)) {
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
