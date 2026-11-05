import React, { useState, useEffect, useCallback } from 'react';
import { adminGetAllJobs, adminUpdateJobStatus, adminDeleteJob } from '../../api/adminJobRequirement';
import { JOB_CATEGORIES, JOB_TYPES } from '../../constants/jobRoles';

// Shared status colours so the header pill and every row stay in sync.
const STATUS_TONE: Record<string, { pill: string; dot: string }> = {
  ACTIVE: { pill: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  CLOSED: { pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  REJECTED: { pill: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};
const FALLBACK_TONE = { pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };

const JOBTYPE_COLORS: Record<string, string> = {
  'Full Time Jobs': 'bg-emerald-50 text-emerald-700',
  'Part Time Jobs': 'bg-yellow-50 text-yellow-700',
  'Work From Home': 'bg-cyan-50 text-cyan-700',
  Internships: 'bg-pink-50 text-pink-700',
  'Work Abroad': 'bg-indigo-50 text-indigo-700',
};

export default function AdminJobRequirements() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetAllJobs({
        city: filterCity,
        category: filterCategory,
        jobType: filterJobType,
        status: filterStatus,
        search: filterSearch,
      });
      if (res.success) {
        setJobs(res.jobs || []);
        setTotal(res.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [filterCity, filterCategory, filterJobType, filterStatus, filterSearch]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleStatusChange = async (id: string, status: string) => {
    setActionLoading(id + status);
    const res = await adminUpdateJobStatus(id, status);
    if (res.success) {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this job posting?')) return;
    setActionLoading(id + 'del');
    const res = await adminDeleteJob(id);
    if (res.success) setJobs(prev => prev.filter(j => j.id !== id));
    setActionLoading(null);
  };

  const clearFilters = () => {
    setFilterSearch('');
    setFilterCity('');
    setFilterCategory('');
    setFilterJobType('');
    setFilterStatus('');
  };

  // ── Stats ──────────────────────────────────────────────────
  const activeCount = jobs.filter(j => j.status === 'ACTIVE').length;
  const closedCount = jobs.filter(j => j.status === 'CLOSED').length;
  const rejectedCount = jobs.filter(j => j.status === 'REJECTED').length;

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Job Board</h3>
          <p className="text-xs text-gray-500 mt-0.5">All job postings submitted by customers</p>
        </div>
        <button
          onClick={fetchJobs}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, color: 'bg-gray-900 text-white' },
          { label: 'Active', value: activeCount, color: 'bg-green-600 text-white' },
          { label: 'Closed', value: closedCount, color: 'bg-gray-200 text-gray-800' },
          { label: 'Rejected', value: rejectedCount, color: 'bg-red-100 text-red-800' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 flex flex-col gap-0.5`}>
            <p className="text-xs font-bold opacity-70 uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-black leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search job title…"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black w-48"
        />
        <input
          type="text"
          placeholder="Filter by city…"
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black w-36"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">All Categories</option>
          {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterJobType}
          onChange={e => setFilterJobType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">All Job Types</option>
          {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">All Statuses</option>
          {['ACTIVE', 'CLOSED', 'REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterSearch || filterCity || filterCategory || filterJobType || filterStatus) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-black border border-gray-200 rounded-lg"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Loading job postings…</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-bold text-gray-700">No job postings found</p>
          <p className="text-xs text-gray-400 mt-1">Customers can post jobs from their portal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const tone = STATUS_TONE[job.status] || FALLBACK_TONE;
            const salaryLabel = (job.salaryMin || job.salaryMax)
              ? `₹${job.salaryMin || '?'} – ₹${job.salaryMax || '?'}/mo`
              : 'Not disclosed';
            const experienceLabel = (job.experienceMin > 0 || job.experienceMax > 0)
              ? `${job.experienceMin || 0}–${job.experienceMax || 0} yrs`
              : 'Fresher';
            const subtitle = [job.company, job.city, job.jobType].filter(Boolean).join(' · ');

            return (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition hover:border-gray-300">

              {/* ── Card top bar ── */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                    {job.status}
                  </span>
                  <span className="whitespace-nowrap text-[11px] font-semibold text-gray-400">
                    {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  {job.customer && (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-gray-900 text-[8px] font-black uppercase text-white">
                        {(job.customer.name || 'C').charAt(0)}
                      </span>
                      <span className="truncate">#{job.customer.customerNo} · {job.customer.name}</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-500 transition hover:bg-gray-100 hover:text-black"
                >
                  {expandedId === job.id ? '▲ Less' : '▼ More'}
                </button>
              </div>

              {/* ── Card body ── */}
              <div className="px-4 py-3">
                {/* Logo tile + title */}
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 break-words text-[15px] font-bold leading-snug text-gray-900">{job.title}</h4>
                    {subtitle && <p className="mt-0.5 truncate text-xs font-medium text-gray-500">{subtitle}</p>}
                  </div>
                </div>

                {/* Key facts */}
                <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-100 bg-gray-100">
                  <div className="min-w-0 bg-white px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Salary</p>
                    <p className="mt-0.5 break-words text-[13px] font-bold text-gray-900">{salaryLabel}</p>
                  </div>
                  <div className="min-w-0 bg-white px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Experience</p>
                    <p className="mt-0.5 break-words text-[13px] font-bold text-gray-900">{experienceLabel}</p>
                  </div>
                </div>

                {/* Role / category / type / remote */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-600">📍 {job.city}</span>
                  {job.role && <span className="break-words rounded-md bg-gray-900 px-2 py-1 text-[10px] font-bold text-white">{job.role}</span>}
                  {job.category && <span className="break-words rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{job.category}</span>}
                  <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${JOBTYPE_COLORS[job.jobType] || 'bg-gray-100 text-gray-600'}`}>{job.jobType}</span>
                  {job.remoteWork && (
                    <span className="rounded-md bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700">Remote: {job.remoteWork}</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5">
                  {job.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleStatusChange(job.id, 'ACTIVE')}
                      disabled={actionLoading === job.id + 'ACTIVE'}
                      className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-[11px] font-bold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
                    >Activate</button>
                  )}
                  {job.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleStatusChange(job.id, 'CLOSED')}
                      disabled={actionLoading === job.id + 'CLOSED'}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                    >Close</button>
                  )}
                  {job.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleStatusChange(job.id, 'REJECTED')}
                      disabled={actionLoading === job.id + 'REJECTED'}
                      className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >Reject</button>
                  )}
                  <button
                    onClick={() => handleDelete(job.id)}
                    disabled={actionLoading === job.id + 'del'}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >Delete</button>
                </div>

                {/* Expanded details */}
                {expandedId === job.id && (
                  <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                    {/* Description */}
                    <div>
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-gray-400">Job Description</p>
                      <p className="whitespace-pre-wrap break-words rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs leading-relaxed text-gray-700">{job.description}</p>
                    </div>

                    {/* Localities */}
                    {job.localities?.length > 0 && (
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-gray-400">Localities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {job.localities.map((l: string) => (
                            <span key={l} className="rounded-md border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[9px] font-bold text-gray-500">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recruiter + Customer */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-gray-400">Recruiter Details</p>
                        {job.company && <p className="break-words text-xs font-bold text-gray-900">Hiring for {job.company}</p>}
                        <a href={`tel:${job.contactPhone}`} className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-gray-700">Phone</span>
                          <span className="font-semibold tabular-nums text-gray-900">+91 {job.contactPhone}</span>
                        </a>
                        <a href={`tel:${job.whatsappNumber || job.contactPhone}`} className="mt-0.5 flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-gray-700">WhatsApp</span>
                          <span className="font-semibold tabular-nums text-gray-900">+91 {job.whatsappNumber || job.contactPhone}</span>
                        </a>
                        {job.alternateMobile && (
                          <p className="mt-0.5 flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold text-gray-700">Alternate</span>
                            <span className="font-semibold tabular-nums text-gray-900">+91 {job.alternateMobile}</span>
                          </p>
                        )}
                        <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-gray-400">
                          {job.showContact === false ? 'Hidden from candidates' : 'Visible to candidates'}
                        </p>
                      </div>
                      {job.customer && (
                        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-gray-400">Posted By (Customer)</p>
                          <p className="break-words text-xs font-bold text-gray-900">#{job.customer.customerNo} · {job.customer.name}</p>
                          <p className="mt-1 text-[11px] font-semibold tabular-nums text-gray-500">{job.customer.phone}</p>
                          {job.customer.email && <p className="break-words text-[11px] text-gray-500">{job.customer.email}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
