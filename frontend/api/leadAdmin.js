import { API_BASE_URL } from './config.js';

const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
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

export const getAllLeads = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/leads`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, data: [], message: 'Network error' };
  }
};

export const updateLeadStatus = async (leadId, status) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/leads/${leadId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, message: 'Network error' };
  }
};

export const getAllLeadSubscriptions = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/lead-subscriptions`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, data: [], message: 'Network error' };
  }
};

export const rejectLeadSubscription = async (subscriptionId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lead-subscriptions/reject/${subscriptionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, message: 'Network error' };
  }
};
