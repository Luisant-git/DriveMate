const fs = require('fs');
const path = require('path');

// ==============================================================================
// 1. UPDATE CustomerPortal.tsx
// ==============================================================================
const custPath = path.join(__dirname, '..', 'frontend', 'pages', 'customer', 'CustomerPortal.tsx');
let cust = fs.readFileSync(custPath, 'utf8');

// Ensure import of job constants
if (!cust.includes('from \'../../constants/jobRoles\'')) {
  cust = cust.replace(
    'import { Customer, BookingType, Trip } from \'../../types\';',
    'import { Customer, BookingType, Trip } from \'../../types\';\nimport { JOB_TYPES, EXP_LEVELS, REMOTE_OPTIONS, ALL_FLAT_ROLES } from \'../../constants/jobRoles\';'
  );
}

// Remove old const JOB_ROLES and const EXP_OPTIONS if present at top
cust = cust.replace(
  /\/\/ ── Job roles ──[\s\S]*?const EXP_OPTIONS = \['Fresher',[\s\S]*?\];\n/,
  ''
);

// Update jobFormData state
const oldJobFormState = `    const [jobFormData, setJobFormData] = useState({
        title: '',
        company: '',
        city: '',
        localities: [] as string[],
        description: '',
        contactName: customer.name || '',
        contactEmail: '',
        contactPhone: customer.phone || '',
        jobType: 'Full Time',
        category: 'Driver',
        experienceYears: '0',
        salaryMin: '',
        salaryMax: '',
    });`;

const newJobFormState = `    const [jobFormData, setJobFormData] = useState({
        title: '',
        company: '',
        city: '',
        localities: [] as string[],
        description: '',
        contactName: customer.name || '',
        contactEmail: customer.email && !customer.email.includes('@temp.com') ? customer.email : '',
        contactPhone: customer.phone || '',
        jobType: 'Full Time Jobs',
        role: '',
        remote: 'No',
        experienceMin: 'Fresher',
        experienceMax: '1',
        salaryMin: '',
        salaryMax: '',
        showContact: true,
        termsAccepted: false
    });
    const [roleSearch, setRoleSearch] = useState('');
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);`;

cust = cust.replace(oldJobFormState, newJobFormState);

// Update handleJobSubmit
const oldHandleSubmit = `    const handleJobSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setJobSubmitting(true);
        try {
            const res = await createJobRequirement({
                ...jobFormData,
                experienceYears: parseInt(jobFormData.experienceYears) || 0,
                salaryMin: jobFormData.salaryMin ? parseFloat(jobFormData.salaryMin) : null,
                salaryMax: jobFormData.salaryMax ? parseFloat(jobFormData.salaryMax) : null,
            });
            if (res.success) {
                toast.success('Job requirement posted!');
                setShowJobForm(false);
                setJobFormData({
                    title: '', company: '', city: '', localities: [],
                    description: '', contactName: customer.name || '',
                    contactEmail: '', contactPhone: customer.phone || '',
                    jobType: 'Full Time', category: 'Driver',
                    experienceYears: '0', salaryMin: '', salaryMax: '',
                });
                setJobLocality('');
                fetchMyJobs();
            } else {
                toast.error(res.error || 'Failed to post job');
            }
        } finally {
            setJobSubmitting(false);
        }
    };`;

const newHandleSubmit = `    const handleJobSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jobFormData.title.trim()) {
            toast.error('Job Title is required');
            return;
        }
        if (!jobFormData.role) {
            toast.error('Please select a Role');
            return;
        }
        if (!jobFormData.city.trim()) {
            toast.error('City is required');
            return;
        }
        if (!jobFormData.contactEmail.trim()) {
            toast.error('Work email is required');
            return;
        }
        if (!jobFormData.contactPhone.trim()) {
            toast.error('Phone number is required');
            return;
        }
        if (!jobFormData.termsAccepted) {
            toast.error('Please accept the Terms and Conditions');
            return;
        }
        setJobSubmitting(true);
        try {
            const expMinVal = jobFormData.experienceMin === 'Fresher' ? 0 : parseInt(jobFormData.experienceMin) || 0;
            const expMaxVal = jobFormData.experienceMax === 'Fresher' ? 0 : parseInt(jobFormData.experienceMax) || 0;

            const res = await createJobRequirement({
                ...jobFormData,
                experienceMin: expMinVal,
                experienceMax: expMaxVal,
                salaryMin: jobFormData.salaryMin ? parseFloat(jobFormData.salaryMin) : null,
                salaryMax: jobFormData.salaryMax ? parseFloat(jobFormData.salaryMax) : null,
            });
            if (res.success) {
                toast.success('Job requirement posted successfully!');
                setShowJobForm(false);
                setJobFormData({
                    title: '', company: '', city: '', localities: [],
                    description: '', contactName: customer.name || '',
                    contactEmail: customer.email && !customer.email.includes('@temp.com') ? customer.email : '',
                    contactPhone: customer.phone || '',
                    jobType: 'Full Time Jobs', role: '', remote: 'No',
                    experienceMin: 'Fresher', experienceMax: '1',
                    salaryMin: '', salaryMax: '', showContact: true, termsAccepted: false
                });
                setJobLocality('');
                setRoleSearch('');
                fetchMyJobs();
            } else {
                toast.error(res.error || 'Failed to post job');
            }
        } finally {
            setJobSubmitting(false);
        }
    };`;

cust = cust.replace(oldHandleSubmit, newHandleSubmit);

// Replace entire Jobs tab content from {/* ═══════════ JOBS TAB ═══════════ */} to the start of PROFILE TAB
const jobsTabStart = '{/* ═══════════ JOBS TAB ═══════════ */}';
const profileTabStart = '{/* ═══════════ PROFILE TAB ═══════════ */}';

const startIdx = cust.indexOf(jobsTabStart);
const endIdx = cust.indexOf(profileTabStart);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find JOBS TAB markers in CustomerPortal.tsx');
  process.exit(1);
}

const newJobsTabJsx = `{/* ═══════════ JOBS TAB ═══════════ */}
                {activeTab === 'JOBS' && (
                    <div className="flex-grow min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar space-y-4">

                        {/* Header row */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">Employee Job Requirements</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Post requirements to hire employees for your business or personal need</p>
                            </div>
                            <button
                                onClick={() => setShowJobForm(v => !v)}
                                className="bg-black text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-800 transition flex items-center gap-1.5"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                {showJobForm ? 'Cancel' : 'Post Job'}
                            </button>
                        </div>

                        {/* ── POST JOB FORM ── */}
                        {showJobForm && (
                            <form onSubmit={handleJobSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Form header */}
                                <div className="bg-black text-white px-4 py-3.5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">New Posting</p>
                                    <h4 className="text-sm font-black mt-0.5">Post an Employee Requirement</h4>
                                </div>

                                <div className="p-4 space-y-4">

                                    {/* Job Title* (Max 150 characters) */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                                                Job Title <span className="text-red-500">*</span>
                                            </label>
                                            <span className="text-[10px] text-gray-400">{jobFormData.title.length}/150</span>
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            maxLength={150}
                                            placeholder="Eg. Sales executives needed urgently for ..."
                                            className="w-full bg-gray-100 border-none rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
                                            value={jobFormData.title}
                                            onChange={e => setJobFormData(p => ({ ...p, title: e.target.value }))}
                                        />
                                    </div>

                                    {/* Job Type* (Pills) */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                            Job Type <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {JOB_TYPES.map(jt => (
                                                <button
                                                    key={jt}
                                                    type="button"
                                                    onClick={() => setJobFormData(p => ({ ...p, jobType: jt }))}
                                                    className={\`px-3 py-1.5 rounded-lg text-xs font-bold border transition \${
                                                        jobFormData.jobType === jt
                                                            ? 'bg-black text-white border-black shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                    }\`}
                                                >
                                                    {jt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Role* (Searchable dropdown with 200+ roles) */}
                                    <div className="relative">
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wide">
                                            Role <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Type or select a role"
                                                className="w-full bg-gray-100 border-none rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none pr-8"
                                                value={jobFormData.role}
                                                onChange={e => {
                                                    setJobFormData(p => ({ ...p, role: e.target.value }));
                                                    setRoleSearch(e.target.value);
                                                    setShowRoleDropdown(true);
                                                }}
                                                onFocus={() => setShowRoleDropdown(true)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRoleDropdown(v => !v)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                            >
                                                <svg className={\`w-4 h-4 transition-transform \${showRoleDropdown ? 'rotate-180' : ''}\`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Dropdown list */}
                                        {showRoleDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-20" onClick={() => setShowRoleDropdown(false)}></div>
                                                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                                                    {ALL_FLAT_ROLES
                                                        .filter(item => !roleSearch || item.label.toLowerCase().includes(roleSearch.toLowerCase()))
                                                        .slice(0, 100)
                                                        .map(item => (
                                                            <div
                                                                key={item.label}
                                                                onClick={() => {
                                                                    setJobFormData(p => ({ ...p, role: item.label }));
                                                                    setShowRoleDropdown(false);
                                                                    setRoleSearch('');
                                                                }}
                                                                className={\`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 flex items-center justify-between \${
                                                                    jobFormData.role === item.label ? 'bg-black text-white font-bold hover:bg-black' : 'text-gray-800 font-medium'
                                                                }\`}
                                                            >
                                                                <span>{item.label}</span>
                                                                <span className={\`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded \${jobFormData.role === item.label ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-500'}\`}>
                                                                    {item.category}
                                                                </span>
                                                            </div>
                                                        ))
                                                    }
                                                    {ALL_FLAT_ROLES.filter(item => !roleSearch || item.label.toLowerCase().includes(roleSearch.toLowerCase())).length === 0 && (
                                                        <div className="p-3 text-xs text-gray-400 text-center">
                                                            No matching role found. You can type a custom role.
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Monthly salary* (Min / Max) */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wide">
                                            Monthly salary <span className="text-red-500">*</span> (₹/month)
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    placeholder="Min"
                                                    className="w-full bg-gray-100 border-none rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
                                                    value={jobFormData.salaryMin}
                                                    onChange={e => setJobFormData(p => ({ ...p, salaryMin: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    placeholder="Max"
                                                    className="w-full bg-gray-100 border-none rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
                                                    value={jobFormData.salaryMax}
                                                    onChange={e => setJobFormData(p => ({ ...p, salaryMax: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Experience (Min / Max dropdowns) */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wide">
                                            Experience
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] text-gray-400 font-bold mb-0.5">Min</label>
                                                <select
                                                    value={jobFormData.experienceMin}
                                                    onChange={e => setJobFormData(p => ({ ...p, experienceMin: e.target.value }))}
                                                    className="w-full bg-gray-100 border-none rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
                                                >
                                                    <option value="">Select Exp..</option>
                                                    {EXP_LEVELS.map(exp => (
                                                        <option key={exp} value={exp}>{exp === 'Fresher' ? 'Fresher' : \`\${exp} yr\${exp === '1' ? '' : 's'}\`}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 font-bold mb-0.5">Max</label>
                                                <select
                                                    value={jobFormData.experienceMax}
                                                    onChange={e => setJobFormData(p => ({ ...p, experienceMax: e.target.value }))}
                                                    className="w-full bg-gray-100 border-none rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
                                                >
                                                    <option value="">Select Exp..</option>
                                                    {EXP_LEVELS.map(exp => (
                                                        <option key={exp} value={exp}>{exp === 'Fresher' ? 'Fresher' : \`\${exp} yr\${exp === '1' ? '' : 's'}\`}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* City* */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wide">
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={60}
                                            placeholder="Type or select a city first"
                                            className="w-full bg-gray-100 border-none rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
                                            value={jobFormData.city}
                                            onChange={e => setJobFormData(p => ({ ...p, city: e.target.value }))}
                                        />
                                    </div>

                                    {/* Localities* (Upto 5) */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wide">
                                            Localities* (Upto 5)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Type or select a locality"
                                                disabled={jobFormData.localities.length >= 5}
                                                className="flex-1 min-w-0 bg-gray-100 border-none rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none disabled:opacity-50"
                                                value={jobLocality}
                                                onChange={e => setJobLocality(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const v = jobLocality.trim();
                                                        if (v && jobFormData.localities.length < 5 && !jobFormData.localities.includes(v)) {
                                                            setJobFormData(p => ({ ...p, localities: [...p.localities, v] }));
                                                            setJobLocality('');
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                disabled={!jobLocality.trim() || jobFormData.localities.length >= 5}
                                                onClick={() => {
                                                    const v = jobLocality.trim();
                                                    if (v && jobFormData.localities.length < 5 && !jobFormData.localities.includes(v)) {
                                                        setJobFormData(p => ({ ...p, localities: [...p.localities, v] }));
                                                        setJobLocality('');
                                                    }
                                                }}
                                                className="flex-shrink-0 px-3 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        {jobFormData.localities.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {jobFormData.localities.map(loc => (
                                                    <span key={loc} className="flex items-center gap-1 bg-gray-200 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-full">
                                                        {loc}
                                                        <button
                                                            type="button"
                                                            onClick={() => setJobFormData(p => ({ ...p, localities: p.localities.filter(l => l !== loc) }))}
                                                            className="hover:text-black text-gray-500 leading-none ml-0.5"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Job Description* (Max 3000 characters) */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                                                Job Description <span className="text-red-500">*</span>
                                            </label>
                                            <span className="text-[10px] text-gray-400">{jobFormData.description.length}/3000</span>
                                        </div>
                                        <textarea
                                            required
                                            rows={4}
                                            maxLength={3000}
                                            placeholder="Type or paste the Job Description here. Only plain text is supported."
                                            className="w-full bg-gray-100 border-none rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black resize-none outline-none"
                                            value={jobFormData.description}
                                            onChange={e => setJobFormData(p => ({ ...p, description: e.target.value }))}
                                        />
                                    </div>

                                    {/* Recruiter details (Cannot be changed later) */}
                                    <div className="pt-3 border-t border-gray-100 space-y-3">
                                        <p className="text-[11px] font-black text-gray-700 uppercase tracking-wide">
                                            Recruiter details (Cannot be changed later)
                                        </p>

                                        {/* Hiring for (Company name) Max 50 characters */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                                Hiring for (Company name)
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={50}
                                                placeholder="Max 50 characters"
                                                className="w-full bg-gray-100 border-none rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
                                                value={jobFormData.company}
                                                onChange={e => setJobFormData(p => ({ ...p, company: e.target.value }))}
                                            />
                                        </div>

                                        {/* Email* */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                maxLength={100}
                                                placeholder="Please use your work email"
                                                className="w-full bg-gray-100 border-none rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
                                                value={jobFormData.contactEmail}
                                                onChange={e => setJobFormData(p => ({ ...p, contactEmail: e.target.value }))}
                                            />
                                        </div>

                                        {/* Phone* */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                                Phone <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-3 rounded-l-lg border-r border-gray-200 bg-gray-200 text-gray-700 font-bold text-sm">
                                                    +91
                                                </span>
                                                <input
                                                    type="tel"
                                                    required
                                                    maxLength={10}
                                                    placeholder="9XXXXXXXXX"
                                                    className="w-full bg-gray-100 border-none rounded-r-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
                                                    value={jobFormData.contactPhone}
                                                    onChange={e => setJobFormData(p => ({ ...p, contactPhone: e.target.value }))}
                                                />
                                            </div>
                                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={jobFormData.showContact}
                                                    onChange={e => setJobFormData(p => ({ ...p, showContact: e.target.checked }))}
                                                    className="w-3.5 h-3.5 text-black rounded focus:ring-black cursor-pointer"
                                                />
                                                <span className="text-xs text-gray-600">
                                                    Display my contact details to candidate
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Can this job be done remotely? * */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                                            Can this job be done remotely? <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            {REMOTE_OPTIONS.map(opt => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setJobFormData(p => ({ ...p, remote: opt }))}
                                                    className={\`flex-1 py-2 rounded-lg text-xs font-bold border transition \${
                                                        jobFormData.remote === opt
                                                            ? 'bg-black text-white border-black shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                    }\`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Terms and conditions* */}
                                    <div className="pt-2">
                                        <label className="flex items-start gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                required
                                                checked={jobFormData.termsAccepted}
                                                onChange={e => setJobFormData(p => ({ ...p, termsAccepted: e.target.checked }))}
                                                className="mt-0.5 w-4 h-4 text-black rounded focus:ring-black cursor-pointer"
                                            />
                                            <span className="text-xs text-gray-600">
                                                I agree to the{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowTerms(true)}
                                                    className="text-black font-bold underline hover:text-gray-800"
                                                >
                                                    Terms and Conditions
                                                </button>
                                                <span className="text-red-500"> *</span>
                                            </span>
                                        </label>
                                    </div>

                                    {/* Submit button */}
                                    <button
                                        type="submit"
                                        disabled={jobSubmitting || !jobFormData.termsAccepted}
                                        className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {jobSubmitting
                                            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Posting…</>
                                            : 'Post Job'
                                        }
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ── MY JOB LISTINGS ── */}
                        {jobsLoading ? (
                            <div className="text-center py-8 text-sm text-gray-400">Loading…</div>
                        ) : myJobs.length === 0 && !showJobForm ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <p className="font-bold text-gray-700">No job postings yet</p>
                                <p className="text-xs text-gray-400 mt-1">Tap "Post Job" to post an employee requirement</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myJobs.map(job => (
                                    <div key={job.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                        {/* Card top bar */}
                                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                            <span className={\`text-[10px] font-black px-2.5 py-0.5 rounded-full \${job.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}\`}>
                                                {job.status}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        {/* Card body */}
                                        <div className="px-4 py-3 space-y-1.5">
                                            <h4 className="font-bold text-sm text-gray-900 leading-tight">{job.title}</h4>
                                            {job.company && <p className="text-xs text-gray-500 font-medium">{job.company}</p>}
                                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">📍 {job.city}</span>
                                                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{job.jobType}</span>
                                                {job.role && (
                                                    <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                                                        {job.role}
                                                    </span>
                                                )}
                                                {(job.salaryMin || job.salaryMax) && (
                                                    <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                                        ₹{job.salaryMin || '?'} – ₹{job.salaryMax || '?'}/mo
                                                    </span>
                                                )}
                                                {(job.experienceMin !== null || job.experienceMax !== null) && (
                                                    <span className="text-[10px] font-bold bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                                                        {job.experienceMin || 0} – {job.experienceMax || 0} yrs exp
                                                    </span>
                                                )}
                                                {job.remote && (
                                                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                                        Remote: {job.remote}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">{job.description}</p>
                                            {job.localities?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 pt-0.5">
                                                    {job.localities.map((l: string) => (
                                                        <span key={l} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">{l}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {/* Card footer */}
                                        <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between gap-2">
                                            <div className="text-xs text-gray-500">
                                                {job.showContact ? (
                                                    <span><span className="font-bold">Contact:</span> {job.contactName} · +91 {job.contactPhone}</span>
                                                ) : (
                                                    <span className="italic text-gray-400">Contact details hidden</span>
                                                )}
                                            </div>
                                            {job.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleCloseJob(job.id)}
                                                    className="text-[11px] font-bold text-red-600 px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 transition"
                                                >
                                                    Close
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                `;

cust = cust.slice(0, startIdx) + newJobsTabJsx + cust.slice(endIdx);
fs.writeFileSync(custPath, cust, 'utf8');
console.log('CustomerPortal.tsx updated with employee requirements form');

// ==============================================================================
// 2. UPDATE AdminJobRequirements.tsx
// ==============================================================================
const adminPath = path.join(__dirname, '..', 'frontend', 'pages', 'admin', 'AdminJobRequirements.tsx');
const adminJsx = `import React, { useState, useEffect, useCallback } from 'react';
import { adminGetAllJobs, adminUpdateJobStatus, adminDeleteJob } from '../../api/adminJobRequirement';
import { JOB_TYPES, ALL_FLAT_ROLES } from '../../constants/jobRoles';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-200 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const JOBTYPE_COLORS: Record<string, string> = {
  'Full Time Jobs': 'bg-emerald-50 text-emerald-700',
  'Part Time Jobs': 'bg-yellow-50 text-yellow-700',
  'Work From Home': 'bg-purple-50 text-purple-700',
  'Internships': 'bg-pink-50 text-pink-700',
  'Work Abroad': 'bg-blue-50 text-blue-700',
};

export default function AdminJobRequirements() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetAllJobs({ 
        city: filterCity, 
        role: filterRole, 
        jobType: filterJobType,
        status: filterStatus 
      });
      if (res.success) {
        setJobs(res.jobs || []);
        setTotal(res.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [filterCity, filterRole, filterJobType, filterStatus]);

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

  const activeCount = jobs.filter(j => j.status === 'ACTIVE').length;
  const closedCount = jobs.filter(j => j.status === 'CLOSED').length;
  const rejectedCount = jobs.filter(j => j.status === 'REJECTED').length;

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Employee Job Requirements</h3>
          <p className="text-xs text-gray-500 mt-0.5">Manage all employee job postings submitted across industries</p>
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <p className="text-xs text-green-600 font-bold uppercase">Active</p>
          <p className="text-2xl font-black text-green-700 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 font-bold uppercase">Closed</p>
          <p className="text-2xl font-black text-gray-600 mt-1">{closedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <p className="text-xs text-red-500 font-bold uppercase">Rejected</p>
          <p className="text-2xl font-black text-red-600 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Filter by city..."
          className="text-xs bg-gray-100 border-none rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-black outline-none w-40"
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by role..."
          className="text-xs bg-gray-100 border-none rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-black outline-none w-44"
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
        />
        <select
          className="text-xs bg-gray-100 border-none rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-black outline-none"
          value={filterJobType}
          onChange={e => setFilterJobType(e.target.value)}
        >
          <option value="">All Job Types</option>
          {JOB_TYPES.map(jt => (
            <option key={jt} value={jt}>{jt}</option>
          ))}
        </select>
        <select
          className="text-xs bg-gray-100 border-none rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-black outline-none"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        {(filterCity || filterRole || filterJobType || filterStatus) && (
          <button
            onClick={() => { setFilterCity(''); setFilterRole(''); setFilterJobType(''); setFilterStatus(''); }}
            className="text-xs font-bold text-gray-500 hover:text-black underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Loading job postings...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="font-bold text-gray-700">No job postings found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting the filters above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Card top bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={\`text-[10px] font-black px-2.5 py-0.5 rounded-full \${STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-600'}\`}>
                    {job.status}
                  </span>
                  {job.customer && (
                    <span className="text-gray-500 font-medium">
                      Customer: <strong className="text-gray-800">{job.customer.name}</strong> ({job.customer.phone})
                    </span>
                  )}
                  {job.remote && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      Remote: {job.remote}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-[11px]">
                    {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                    className="font-bold text-gray-600 hover:text-black"
                  >
                    {expandedId === job.id ? '▲ Less' : '▼ More'}
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-gray-900">{job.title}</h4>
                    {job.company && (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {job.company}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      📍 {job.city}
                    </span>
                    <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full \${JOBTYPE_COLORS[job.jobType] || 'bg-blue-50 text-blue-700'}\`}>
                      {job.jobType}
                    </span>
                    {job.role && (
                      <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                        {job.role}
                      </span>
                    )}
                    {(job.salaryMin || job.salaryMax) && (
                      <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        ₹{job.salaryMin || '?'} – ₹{job.salaryMax || '?'}/mo
                      </span>
                    )}
                    {(job.experienceMin !== null || job.experienceMax !== null) && (
                      <span className="text-[10px] font-bold bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                        {job.experienceMin || 0} – {job.experienceMax || 0} yrs exp
                      </span>
                    )}
                  </div>

                  {job.localities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {job.localities.map((l: string) => (
                        <span key={l} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{l}</span>
                      ))}
                    </div>
                  )}

                  {/* Recruiter contact */}
                  <div className="text-xs text-gray-600 pt-2 flex flex-wrap gap-3">
                    <span><strong className="text-gray-700">Recruiter:</strong> {job.contactName}</span>
                    <span><strong className="text-gray-700">Phone:</strong> +91 {job.contactPhone}</span>
                    {job.contactEmail && <span><strong className="text-gray-700">Email:</strong> {job.contactEmail}</span>}
                    <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded \${job.showContact ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}\`}>
                      {job.showContact ? '✓ Candidate can see phone' : '🔒 Phone hidden'}
                    </span>
                  </div>

                  {/* Expanded description */}
                  {expandedId === job.id && (
                    <div className="pt-3 border-t border-gray-100 text-xs text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-lg mt-2">
                      <p className="font-bold text-gray-500 mb-1 uppercase text-[10px]">Job Description</p>
                      {job.description}
                    </div>
                  )}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(adminPath, adminJsx, 'utf8');
console.log('AdminJobRequirements.tsx updated');

