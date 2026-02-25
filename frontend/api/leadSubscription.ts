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

export const getAllLeadPlans = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lead-subscriptions/plans`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, data: [], message: 'Network error' };
  }
};

export const createLeadPlan = async (planData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lead-subscriptions/plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, message: 'Network error' };
  }
};

export const updateLeadPlan = async (id, planData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lead-subscriptions/plans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, message: 'Network error' };
  }
};

export const createLeadSubscription = async (subscriptionData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/lead-subscriptions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(subscriptionData),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, message: 'Network error' };
  }
};

export const getLeadSubscriptions = async () => {
  try {
    const token = localStorage.getItem('leadToken');
    const res = await fetch(`${API_BASE_URL}/api/lead-subscriptions/my-subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, data: [], message: 'Network error' };
  }
};

export const purchaseLeadSubscription = async (planId, paymentMethod) => {
  try {
    const token = localStorage.getItem('leadToken');
    const res = await fetch(`${API_BASE_URL}/api/lead-subscriptions/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ planId, paymentMethod }),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, message: 'Network error' };
  }
};
