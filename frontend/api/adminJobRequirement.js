const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const adminGetAllJobs = async ({ city = '', category = '', role = '', jobType = '', status = '', search = '', page = 1 } = {}) => {
  try {
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (city) params.set('city', city);
    if (category) params.set('category', category);
    if (role) params.set('role', role);
    if (jobType) params.set('jobType', jobType);
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const res = await fetch(`${API_BASE_URL}/api/job-requirements/admin/all?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Network error' };
  }
};

export const adminUpdateJobStatus = async (id, status) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/job-requirements/admin/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Network error' };
  }
};

export const adminDeleteJob = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/job-requirements/admin/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Network error' };
  }
};
