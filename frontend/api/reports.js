import { API_BASE_URL } from './config';

export const getDriverReports = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/api/reports/drivers?${params}`, {
      credentials: 'include',
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching driver reports:', error);
    return { success: false, error: 'Failed to fetch driver reports' };
  }
};

export const getCustomerReports = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE_URL}/api/reports/customers?${params}`, {
      credentials: 'include',
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching customer reports:', error);
    return { success: false, error: 'Failed to fetch customer reports' };
  }
};

export const getRevenueReport = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE_URL}/api/reports/revenue?${params}`, {
      credentials: 'include',
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    return { success: false, error: 'Failed to fetch revenue report' };
  }
};

export const getDriverTrips = async (driverId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE_URL}/api/reports/drivers/${driverId}/trips?${params}`, {
      credentials: 'include',
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    return { success: false, error: 'Failed to fetch driver trips' };
  }
};

export const getCustomerTrips = async (customerId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE_URL}/api/reports/customers/${customerId}/trips?${params}`, {
      credentials: 'include',
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching customer trips:', error);
    return { success: false, error: 'Failed to fetch customer trips' };
  }
};
