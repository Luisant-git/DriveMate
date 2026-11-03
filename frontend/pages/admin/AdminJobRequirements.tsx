import React, { useState, useEffect, useCallback } from 'react';
import { adminGetAllJobs, adminUpdateJobStatus, adminDeleteJob } from '../../api/adminJobRequirement';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   'bg-green-100 text-green-800',
  CLOSED:   'bg-gray-200 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const CATEGORY_COLORS: Record<string, string> = {
  Driver:    'bg-blue-50 text-blue-700',
  Chauffeur: 'bg-purple-50 text-purple-700',
  Delivery:  'bg-orange-50 text-orange-700',
  Other:     'bg-gray-100 text-gray-600',
};

const JOBTYPE_COLORS: Record<string, string> = {
  'Full Time': 'bg-emerald-50 text-emerald-700',
  'Part Time': 'bg-yellow-50 text-yellow-700',
  Contract:    'bg-pink-50 text-pink-700',
  Daily:       'bg-cyan-50 text-cyan-700',
};

export default function AdminJobRequirements() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetAllJobs({ city: filterCity, category: filterCategory, status: filterStatus });
      if (res.success) {
        setJobs(res.jobs || []);
        setTotal(res.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [filterCity, filterCategory, filterStatus]);

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

  // ── Stats ──────────────────────────────────────────────────
  const activeCount   = jobs.filter(j => j.status === 'ACTIVE').length;
  const closedCount   = jobs.filter(j => j.status === 'CLOSED').length;
  const rejectedCount = jobs.filter(j => j.status === 'REJECTED').length;

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Driver Job Requirements</h3>
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
          {['Driver', 'Chauffeur', 'Delivery', 'Other'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">All Statuses</option>
          {['ACTIVE', 'CLOSED', 'REJECTED'].map(s => <option key={s}>{s}</option>)}
        </select>
        {(filterCity || filterCategory || filterStatus) && (
          <button
            onClick={() => { setFilterCity(''); setFilterCategory(''); setFilterStatus(''); }}
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
          <p className="text-xs text-gray-400 mt-1">Customers can post requirements from their portal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* ── Card top bar ── */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${STATUS_COLORS[job.status] || 'bg-gray-100'}`}>
                    {job.status}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  {job.customer && (
                    <span className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      #{job.customer.customerNo} · {job.customer.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                  className="text-[11px] font-bold text-gray-500 hover:text-black px-2 py-1 rounded transition"
                >
                  {expandedId === job.id ? '▲ Less' : '▼ More'}
                </button>
              </div>

              {/* ── Card body ── */}
              <div className="px-4 py-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 leading-tight">{job.title}</h4>
                    {job.company && <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">📍 {job.city}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[job.category] || 'bg-gray-100 text-gray-600'}`}>{job.category}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${JOBTYPE_COLORS[job.jobType] || 'bg-gray-100 text-gray-600'}`}>{job.jobType}</span>
                      {(job.salaryMin || job.salaryMax) && (
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          ₹{job.salaryMin || '?'} – ₹{job.salaryMax || '?'}/mo
                        </span>
                      )}
                      {job.experienceYears > 0 && (
                        <span className="text-[10px] font-bold bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                          {job.experienceYears}+ yrs
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1.5 flex-shrink-0 self-start">
                    {job.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(job.id, 'ACTIVE')}
                        disabled={actionLoading === job.id + 'ACTIVE'}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition disabled:opacity-50"
                      >Activate</button>
                    )}
                    {job.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleStatusChange(job.id, 'CLOSED')}
                        disabled={actionLoading === job.id + 'CLOSED'}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition disabled:opacity-50"
                      >Close</button>
                    )}
                    {job.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleStatusChange(job.id, 'REJECTED')}
                        disabled={actionLoading === job.id + 'REJECTED'}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
                      >Reject</button>
                    )}
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={actionLoading === job.id + 'del'}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                    >Delete</button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === job.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {/* Description */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Description</p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                    </div>

                    {/* Localities */}
                    {job.localities?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Areas / Localities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {job.localities.map((l: string) => (
                            <span key={l} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact + Customer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Recruiter Contact</p>
                        <p className="text-xs font-bold text-gray-900">{job.contactName}</p>
                        <a href={`tel:${job.contactPhone}`} className="text-xs font-bold text-blue-600 hover:underline block mt-0.5">{job.contactPhone}</a>
                        {job.contactEmail && <p className="text-xs text-gray-500 mt-0.5">{job.contactEmail}</p>}
                      </div>
                      {job.customer && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Posted By (Customer)</p>
                          <p className="text-xs font-bold text-gray-900">#{job.customer.customerNo} · {job.customer.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{job.customer.phone}</p>
                          {job.customer.email && <p className="text-xs text-gray-500">{job.customer.email}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
