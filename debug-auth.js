// Debug script to check authentication
console.log('=== Authentication Debug ===');

// Check if token exists in localStorage
const token = localStorage.getItem('auth-token');
console.log('Token in localStorage:', token);

if (token) {
  // Try to decode the token (without verification)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Token expiry:', new Date(payload.exp * 1000));
    console.log('Is token expired?', Date.now() > payload.exp * 1000);
  } catch (e) {
    console.log('Error decoding token:', e);
  }
}

// Test API call
const API_BASE_URL = 'https://drivemate.api.luisant.cloud';

fetch(`${API_BASE_URL}/api/bookings/my-bookings`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  },
  credentials: 'include'
})
.then(response => {
  console.log('API Response status:', response.status);
  console.log('API Response headers:', [...response.headers.entries()]);
  return response.json();
})
.then(data => {
  console.log('API Response data:', data);
})
.catch(error => {
  console.error('API Error:', error);
});