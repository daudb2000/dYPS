// Debug authentication for session-based system
// Test your current session authentication

console.log('🔧 Testing DYPS Session Authentication');

const testSessionAuth = async () => {
  const baseUrl = 'http://localhost:3008'; // or your Railway URL

  try {
    console.log('1. Testing login...');

    // First login to get session
    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
      credentials: 'include' // Important for cookies
    });

    console.log('Login status:', loginResponse.status);
    const loginResult = await loginResponse.json();
    console.log('Login response:', loginResult);

    // Get cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies set:', cookies);

    if (loginResponse.ok) {
      console.log('✅ Login successful');

      // Test accessing protected endpoint with session
      console.log('2. Testing protected endpoint...');
      const protectedResponse = await fetch(`${baseUrl}/api/admin/pending`, {
        method: 'GET',
        headers: {
          'Cookie': cookies // Pass the session cookie
        }
      });

      console.log('Protected endpoint status:', protectedResponse.status);
      const protectedResult = await protectedResponse.text();
      console.log('Protected endpoint response:', protectedResult);

      if (protectedResponse.ok) {
        console.log('✅ Session authentication working');
      } else {
        console.log('❌ Session authentication failed');
      }
    } else {
      console.log('❌ Login failed');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
};

testSessionAuth();