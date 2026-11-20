import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminGetAllJobs, adminUpdateJobStatus, adminDeleteJob } from '../../api/adminJobRequirement';
import { JOB_TYPES } from '../../constants/jobRoles';
import CategorySelect from '../../components/jobs/CategorySelect';
import FormattedJobDescription from '../../components/jobs/FormattedJobDescription';

// Shared status metadata so header pills, tabs, and action groups stay consistent.
const STATUS_META: Record<string, { label: string; pill: string; dot: string }> = {
  PENDING: { label: 'PENDING APPROVAL', pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  ACTIVE: { label: 'APPROVED · ACTIVE', pill: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  CLOSED: { label: 'CLOSED', pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  REJECTED: { label: 'REJECTED', pill: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};
const FALLBACK_META = { label: 'UNKNOWN', pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };

const JOBTYPE_COLORS: Record<string, string> = {
  'Full Time Jobs': 'bg-emerald-50 text-emerald-700',
  'Part Time Jobs': 'bg-yellow-50 text-yellow-700',
  'Work From Home': 'bg-cyan-50 text-cyan-700',
  Internships: 'bg-pink-50 text-pink-700',
  'Work Abroad': 'bg-indigo-50 text-indigo-700',
};

type JobCounts = {
  total: number;
  pending: number;
  active: number;
  closed: number;
  rejected: number;
};

const EMPTY_COUNTS: JobCounts = { total: 0, pending: 0, active: 0, closed: 0, rejected: 0 };

const STATUS_SUCCESS_MSG: Record<string, string> = {
  ACTIVE: 'Job approved and marked Active.',
  CLOSED: 'Job marked as Closed.',
  REJECTED: 'Job has been Rejected.',
};

export default function AdminJobRequirements() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [counts, setCounts] = useState<JobCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState<'' | 'PENDING' | 'ACTIVE' | 'CLOSED' | 'REJECTED'>('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const selectedJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) || null : null;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetAllJobs({
        city: filterCity,
        category: filterCategory,
        jobType: filterJobType,
        status: activeStatusTab,
        search: filterSearch,
      });
      if (res.success) {
        const list = res.jobs || [];
        setJobs(list);
        if (res.counts) {
          setCounts(res.counts);
        } else {
          setCounts({
            total: res.total ?? list.length,
            pending: list.filter((j: any) => j.status === 'PENDING').length,
            active: list.filter((j: any) => j.status === 'ACTIVE').length,
            closed: list.filter((j: any) => j.status === 'CLOSED').length,
            rejected: list.filter((j: any) => j.status === 'REJECTED').length,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [filterCity, filterCategory, filterJobType, activeStatusTab, filterSearch]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleStatusChange = async (id: string, status: string, customMessage?: string) => {
    setActionLoading(id + status);
    try {
      const res = await adminUpdateJobStatus(id, status);
      if (res.success) {
        toast.success(customMessage || STATUS_SUCCESS_MSG[status] || 'Status updated.');
        await fetchJobs();
      } else {
        toast.error(res.error || 'Failed to update job status');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this job posting?')) return;
    setActionLoading(id + 'del');
    try {
      const res = await adminDeleteJob(id);
      if (res.success) {
        toast.success('Job deleted.');
        if (selectedJobId === id) setSelectedJobId(null);
        await fetchJobs();
      } else {
        toast.error(res.error || 'Failed to delete job');
      }
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (!selectedJobId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedJobId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedJobId]);

  const formatSalary = (job: any) =>
    (job.salaryMin || job.salaryMax)
      ? `₹${job.salaryMin || '?'} – ₹${job.salaryMax || '?'}/mo`
      : 'Not disclosed';

  const formatExperience = (job: any) =>
    (job.experienceMin > 0 || job.experienceMax > 0)
      ? `${job.experienceMin || 0}–${job.experienceMax || 0} yrs`
      : 'Fresher';

  const renderJobActions = (job: any, stacked = false) => (
    <div className={`flex flex-wrap items-center ${stacked ? 'justify-between gap-2' : 'justify-between gap-2'}`}>
      <div className="flex flex-wrap items-center gap-2">
        {job.status === 'PENDING' && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Approval:</span>
            <button
              onClick={() => handleStatusChange(job.id, 'ACTIVE', 'Job approved and is now Active.')}
              disabled={actionLoading === job.id + 'ACTIVE'}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
            >Approve</button>
            <button
              onClick={() => handleStatusChange(job.id, 'REJECTED', 'Job rejected.')}
              disabled={actionLoading === job.id + 'REJECTED'}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >Reject</button>
          </>
        )}
        {job.status === 'ACTIVE' && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Listing:</span>
            <button
              onClick={() => handleStatusChange(job.id, 'CLOSED', 'Job closed.')}
              disabled={actionLoading === job.id + 'CLOSED'}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
            >Close Job</button>
          </>
        )}
        {job.status === 'CLOSED' && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Listing:</span>
            <button
              onClick={() => handleStatusChange(job.id, 'ACTIVE', 'Job activated.')}
              disabled={actionLoading === job.id + 'ACTIVE'}
              className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-bold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
            >Activate</button>
          </>
        )}
        {job.status === 'REJECTED' && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Approval:</span>
            <button
              onClick={() => handleStatusChange(job.id, 'ACTIVE', 'Job approved and marked Active.')}
              disabled={actionLoading === job.id + 'ACTIVE'}
              className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-[11px] font-bold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
            >Approve</button>
          </>
        )}
      </div>

      <div className="flex items-center">
        <button
          onClick={() => handleDelete(job.id)}
          disabled={actionLoading === job.id + 'del'}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
        >Delete</button>
      </div>
    </div>
  );

  const clearFilters = () => {
    setFilterSearch('');
    setFilterCity('');
    setFilterCategory('');
    setFilterJobType('');
    setActiveStatusTab('');
  };

  const summaryCards: {
    key: '' | 'PENDING' | 'ACTIVE' | 'CLOSED' | 'REJECTED';
    label: string;
    value: number;
    dot: string;
    labelColor: string;
    cardStyle: string;
    selectedStyle: string;
  }[] = [
    {
      key: '',
      label: 'Total Jobs',
      value: counts.total,
      dot: 'bg-slate-700',
      labelColor: 'text-slate-700',
      cardStyle: 'bg-slate-100 border-slate-300 hover:bg-slate-200/70',
      selectedStyle: 'bg-slate-200 border-slate-800 ring-1 ring-slate-800/20',
    },
    {
      key: 'PENDING',
      label: 'Pending Approval',
      value: counts.pending,
      dot: 'bg-amber-500',
      labelColor: 'text-amber-800',
      cardStyle: 'bg-amber-100 border-amber-300 hover:bg-amber-200/70',
      selectedStyle: 'bg-amber-200/80 border-amber-600 ring-1 ring-amber-600/25',
    },
    {
      key: 'ACTIVE',
      label: 'Active',
      value: counts.active,
      dot: 'bg-emerald-600',
      labelColor: 'text-emerald-800',
      cardStyle: 'bg-emerald-100 border-emerald-300 hover:bg-emerald-200/70',
      selectedStyle: 'bg-emerald-200/80 border-emerald-600 ring-1 ring-emerald-600/25',
    },
    {
      key: 'CLOSED',
      label: 'Closed',
      value: counts.closed,
      dot: 'bg-gray-500',
      labelColor: 'text-gray-700',
      cardStyle: 'bg-gray-100 border-gray-300 hover:bg-gray-200/80',
      selectedStyle: 'bg-gray-200 border-gray-700 ring-1 ring-gray-700/20',
    },
    {
      key: 'REJECTED',
      label: 'Rejected',
      value: counts.rejected,
      dot: 'bg-rose-500',
      labelColor: 'text-rose-800',
      cardStyle: 'bg-rose-100 border-rose-300 hover:bg-rose-200/70',
      selectedStyle: 'bg-rose-200/80 border-rose-600 ring-1 ring-rose-600/25',
    },
  ];

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

      {/* ── Summary cards (light pastel tinted bordered cards; click to filter) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summaryCards.map(s => {
          const isSelected = activeStatusTab === s.key;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setActiveStatusTab(s.key)}
              className={`rounded-2xl border p-4 flex flex-col items-start gap-1.5 text-left text-gray-900 transition ${
                isSelected ? s.selectedStyle : s.cardStyle
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                <p className={`text-[11px] font-bold uppercase tracking-wider ${s.labelColor}`}>
                  {s.label}
                </p>
              </div>
              <p className="text-2xl font-black leading-none tabular-nums text-gray-900">{s.value}</p>
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search job title…"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] w-48"
        />
        <input
          type="text"
          placeholder="Filter by city…"
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C] w-36"
        />
        <CategorySelect
          value={filterCategory}
          onChange={setFilterCategory}
          placeholder="All Categories"
        />
        <select
          value={filterJobType}
          onChange={e => setFilterJobType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B192C]"
        >
          <option value="">All Job Types</option>
          {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterSearch || filterCity || filterCategory || filterJobType || activeStatusTab) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-[#0B192C] border border-gray-200 rounded-lg"
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
          <p className="text-xs text-gray-400 mt-1">
            {activeStatusTab === 'PENDING'
              ? 'No jobs are currently waiting for approval'
              : 'Customers can post jobs from their portal'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const meta = STATUS_META[job.status] || { ...FALLBACK_META, label: job.status || 'UNKNOWN' };
            const salaryLabel = formatSalary(job);
            const experienceLabel = formatExperience(job);
            const subtitle = [job.company, job.city, job.jobType].filter(Boolean).join(' · ');

            return (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition hover:border-gray-300">

              {/* ── Card top bar ── */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
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
                  onClick={() => setSelectedJobId(job.id)}
                  className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-700 transition hover:bg-[#0B192C] hover:text-white hover:border-[#0B192C]"
                >
                  View Full Job ↗
                </button>
              </div>

              {/* ── Card body ── */}
              <div className="px-4 py-3">
                {/* Logo tile + clickable title */}
                <div
                  onClick={() => setSelectedJobId(job.id)}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B192C] text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 break-words text-[15px] font-bold leading-snug text-gray-900 group-hover:underline">{job.title}</h4>
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

                {/* Separated Action Groups: Approval / Active-Close on left, Delete on right */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  {renderJobActions(job)}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* ── Naukri-style Full Job Detail Modal ── */}
      {selectedJob && (() => {
        const meta = STATUS_META[selectedJob.status] || { ...FALLBACK_META, label: selectedJob.status || 'UNKNOWN' };
        const localities: string[] = (selectedJob.localities || []).filter(
          (l: string) => l && l.trim() && l.trim().toLowerCase() !== 'null'
        );

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-[1px]"
            onClick={() => setSelectedJobId(null)}
          >
            <div
              className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal top bar */}
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${meta.pill}`}>
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">
                    Posted on {new Date(selectedJob.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedJobId(null)}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-[#0B192C]"
                  aria-label="Close job details"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Naukri-style body */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* Hero Header Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0B192C] text-white shadow-sm">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug break-words">
                        {selectedJob.title}
                      </h2>
                      {selectedJob.company && (
                        <p className="mt-1 text-sm font-bold text-gray-600">
                          {selectedJob.company}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Key Highlights Strip */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 text-sm">💼</span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Experience</p>
                        <p className="text-sm font-bold text-gray-900">{formatExperience(selectedJob)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 text-sm">₹</span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Salary</p>
                        <p className="text-sm font-bold text-gray-900">{formatSalary(selectedJob)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 text-sm">📍</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location</p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {selectedJob.city}{localities.length > 0 ? ` (${localities.join(', ')})` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedJob.role && <span className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-bold text-white">{selectedJob.role}</span>}
                    {selectedJob.category && <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">{selectedJob.category}</span>}
                    <span className={`rounded-lg px-3 py-1 text-xs font-bold ${JOBTYPE_COLORS[selectedJob.jobType] || 'bg-gray-100 text-gray-600'}`}>{selectedJob.jobType}</span>
                    {selectedJob.remoteWork && (
                      <span className="rounded-lg bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">Remote: {selectedJob.remoteWork}</span>
                    )}
                  </div>
                </div>

                {/* 2-Column Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left: Full Job Description & Role Info */}
                  <div className="lg:col-span-2 space-y-5">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                      <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3 mb-4">
                        Job Description
                      </h3>
                      <FormattedJobDescription text={selectedJob.description} />

                      {localities.length > 0 && (
                        <div className="mt-6 border-t border-gray-100 pt-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Preferred Localities</h4>
                          <div className="flex flex-wrap gap-2">
                            {localities.map(l => (
                              <span key={l} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-700">
                                📍 {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Role</p>
                          <p className="mt-0.5 text-sm font-bold text-gray-900">{selectedJob.role || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Category</p>
                          <p className="mt-0.5 text-sm font-bold text-gray-900">{selectedJob.category || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Employment Type</p>
                          <p className="mt-0.5 text-sm font-bold text-gray-900">{selectedJob.jobType}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Remote Work</p>
                          <p className="mt-0.5 text-sm font-bold text-gray-900">{selectedJob.remoteWork || 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Sidebar: Recruiter, Customer & Admin Controls */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Recruiter Details</p>
                      {selectedJob.company && (
                        <p className="text-sm font-extrabold text-gray-900 mb-3">Hiring for {selectedJob.company}</p>
                      )}
                      <div className="space-y-2.5 text-xs">
                        <a href={`tel:${selectedJob.contactPhone}`} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 hover:bg-gray-100 transition">
                          <span className="font-bold text-gray-600">Phone</span>
                          <span className="font-bold tabular-nums text-gray-900">+91 {selectedJob.contactPhone}</span>
                        </a>
                        <a href={`tel:${selectedJob.whatsappNumber || selectedJob.contactPhone}`} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 hover:bg-gray-100 transition">
                          <span className="font-bold text-gray-600">WhatsApp</span>
                          <span className="font-bold tabular-nums text-gray-900">+91 {selectedJob.whatsappNumber || selectedJob.contactPhone}</span>
                        </a>
                        {selectedJob.alternateMobile && (
                          <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                            <span className="font-bold text-gray-600">Alternate</span>
                            <span className="font-bold tabular-nums text-gray-900">+91 {selectedJob.alternateMobile}</span>
                          </div>
                        )}
                      </div>
                      <p className={`mt-3 inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold ${
                        selectedJob.showContact === false
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-50 text-green-700'
                      }`}>
                        {selectedJob.showContact === false ? 'Hidden from candidates' : 'Visible to candidates'}
                      </p>
                    </div>

                    {selectedJob.customer && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Posted By (Customer)</p>
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-black uppercase text-white">
                            {(selectedJob.customer.name || 'C').charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 break-words">
                              #{selectedJob.customer.customerNo} · {selectedJob.customer.name}
                            </p>
                            <p className="text-xs font-semibold tabular-nums text-gray-500">{selectedJob.customer.phone}</p>
                            {selectedJob.customer.email && (
                              <p className="text-xs text-gray-500 break-words">{selectedJob.customer.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Admin Actions</p>
                      {renderJobActions(selectedJob, true)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
