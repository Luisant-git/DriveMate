// src/api/subscriptionApi.js
import { API_BASE_URL } from './config.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token');
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
    // no body (e.g. 204)
  }

  return {
    success: response.ok,
    status: response.status,
    data: body,
    message: !response.ok ? body?.error || body?.message : undefined,
  };
};

// GET all active subscription plans
export const getSubscriptionPlans = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subscriptions/plans`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await handleResponse(res);
  } catch {
    return { success: false, data: [], message: 'Network error' };
  }
};

// CREATE subscription plan (Admin)
export const createSubscriptionPlan = async (planData) => {
  // planData: { name, duration, price, description, (optional) type }
  try {
    const res = await fetch(`${API_BASE_URL}/api/subscriptions/plans`, {
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

// UPDATE subscription plan (Admin)
// id is a STRING, e.g. "cmkny9ui700077jkmhqmc9zaf"
export const updateSubscriptionPlan = async (id, planData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subscriptions/plans/${id}`, {
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

// DELETE (soft delete) subscription plan (Admin)
export const deleteSubscriptionPlan = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/subscriptions/plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (res.status === 204) {
      return { success: true, status: 204 };
    }

    return await handleResponse(res);
  } catch {
    return { success: false, message: 'Network error' };
  }
};