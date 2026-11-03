const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const createJobRequirement = async (data) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/job-requirements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result;
  } catch (e) {
    return { success: false, error: 'Network error' };
  }
};

export const getMyJobRequirements = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/job-requirements/mine`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Network error' };
  }
};

export const getAllJobRequirements = async ({ city = '', category = '' } = {}) => {
  try {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (category) params.set('category', category);
    const res = await fetch(`${API_BASE_URL}/api/job-requirements?${params}`, {
      credentials: 'include',
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Network error' };
  }
};

export const closeJobRequirement = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/job-requirements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Network error' };
  }
};
