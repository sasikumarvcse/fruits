const http = require('http');

console.log('🧪 Testing Registration Endpoint');
console.log('================================');
console.log('');

// Test data for registration with unique values
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: `test${Date.now()}@example.com`,
  mobile: `1234567${Date.now().toString().slice(-4)}`,
  password: 'password123',
  role: 'user'
};

// Convert to JSON string
const postData = JSON.stringify(testUser);

// Request options
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('📤 Sending registration request...');
console.log('📋 Test data:', testUser);
console.log('');

// Make the request
const req = http.request(options, (res) => {
  console.log(`📥 Response Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`📋 Response Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('');
    console.log('📄 Response Body:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log(data);
    }
    
    console.log('');
    if (res.statusCode === 201) {
      console.log('✅ Registration test PASSED!');
    } else {
      console.log('❌ Registration test FAILED!');
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Request Error:', err.message);
  console.log('');
  console.log('💡 Make sure the server is running on port 5000');
});

// Send the request
req.write(postData);
req.end();
