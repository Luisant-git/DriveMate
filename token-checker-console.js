// Copy and paste this entire code block into your browser console

console.log('🔍 DriveMate Token Checker');
console.log('========================');

// Check if token exists
const token = localStorage.getItem('auth-token');
console.log('1. Token exists:', !!token);

if (!token) {
  console.log('❌ NO TOKEN FOUND');
  console.log('   → User needs to login first');
  console.log('   → Go to: /customer/login');
} else {
  console.log('✅ Token found:', token.substring(0, 50) + '...');
  
  try {
    // Decode token
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid token format');
    } else {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      console.log('2. Token Header:', header);
      console.log('3. Token Payload:', payload);
      console.log('   → User ID:', payload.userId);
      console.log('   → Role:', payload.role);
      console.log('   → Issued:', new Date(payload.iat * 1000));
      console.log('   → Expires:', new Date(payload.exp * 1000));
      
      const isExpired = Date.now() > payload.exp * 1000;
      console.log('   → Is Expired:', isExpired);
      
      if (isExpired) {
        console.log('❌ TOKEN EXPIRED - User needs to login again');
      } else {
        console.log('✅ Token is valid');
      }
    }
  } catch (e) {
    console.log('❌ Error decoding token:', e.message);
  }
}

// Test API call
console.log('\n4. Testing API Call...');
const API_BASE_URL = 'https://drivemate.api.luisant.cloud';

fetch(`${API_BASE_URL}/api/bookings/my-bookings`, {
  method: 'GET',
  headers: {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
.then(response => {
  console.log('   → Status:', response.status);
  console.log('   → Status Text:', response.statusText);
  return response.json();
})
.then(data => {
  console.log('   → Response:', data);
  if (data.error) {
    console.log('❌ API Error:', data.error);
  } else {
    console.log('✅ API Success');
  }
})
.catch(error => {
  console.log('❌ Network Error:', error.message);
});

console.log('\n📋 Summary:');
console.log('- If no token: User needs to login');
console.log('- If token expired: User needs to login again');
console.log('- If API returns 401: Authentication failed');