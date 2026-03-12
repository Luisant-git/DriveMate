// Run this in browser console to check token status
console.log('=== Token Debug ===');
const token = localStorage.getItem('auth-token');
console.log('Token exists:', !!token);
console.log('Token value:', token);

if (token) {
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token payload:', payload);
    console.log('User ID:', payload.userId);
    console.log('Role:', payload.role);
    console.log('Issued at:', new Date(payload.iat * 1000));
    console.log('Expires at:', new Date(payload.exp * 1000));
    console.log('Is expired:', Date.now() > payload.exp * 1000);
  } catch (e) {
    console.error('Error decoding token:', e);
  }
} else {
  console.log('❌ No token found - User needs to login');
}

// Test API call
console.log('\n=== Testing API Call ===');
const API_BASE_URL = 'https://drivemate.api.luisant.cloud';
fetch(`${API_BASE_URL}/api/bookings/my-bookings`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log('API Response:', d))
.catch(e => console.error('API Error:', e));
