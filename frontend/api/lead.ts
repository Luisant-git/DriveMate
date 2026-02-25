import { API_BASE_URL } from './config.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('leadToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // no body
  }
  return {
    success: response.ok,
    status: response.status,
    data: body,
    message: !response.ok ? body?.error || body?.message : undefined,
  };
};

export const registerLead = async (data) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, message: 'Network error' };
  }
};

export const loginLead = async (phone, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
      credentials: 'include',
    });
    const result = await handleResponse(res);
    if (result.success && result.data?.token) {
      localStorage.setItem('leadToken', result.data.token);
      localStorage.setItem('leadData', JSON.stringify(result.data.lead));
    }
    return result;
  } catch {
    return { success: false, message: 'Network error' };
  }
};

export const updateLeadProfile = async (data) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });
    const result = await handleResponse(res);
    console.log('Update profile result:', result);
    return result;
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const logoutLead = () => {
  localStorage.removeItem('leadToken');
  localStorage.removeItem('leadData');
};

export const getLeadData = () => {
  const data = localStorage.getItem('leadData');
  return data ? JSON.parse(data) : null;
};

export const isLeadAuthenticated = () => {
  return !!localStorage.getItem('leadToken');
};
