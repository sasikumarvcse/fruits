#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing Single Port Setup');
console.log('============================');
console.log('');

const testUrls = [
  { url: 'http://localhost:5000', description: 'Frontend (Main Page)' },
  { url: 'http://localhost:5000/api/products', description: 'Backend API (Products)' },
  { url: 'http://localhost:5000/admin-login.html', description: 'Admin Panel' },
  { url: 'http://localhost:5000/api/auth/register', description: 'Auth API' }
];

async function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${description}: ${res.statusCode} ${res.statusMessage}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log(`⏰ ${description}: Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🔍 Testing endpoints...');
  console.log('');

  let passed = 0;
  let total = testUrls.length;

  for (const test of testUrls) {
    const success = await testEndpoint(test.url, test.description);
    if (success) passed++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  console.log('');
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log('');

  if (passed === total) {
    console.log('🎉 All tests passed! Your single port setup is working perfectly!');
    console.log('');
    console.log('🌐 Access your application at: http://localhost:5000');
    console.log('🔧 API endpoints at: http://localhost:5000/api');
    console.log('👑 Admin panel at: http://localhost:5000/admin-login.html');
  } else {
    console.log('⚠️  Some tests failed. Make sure your server is running:');
    console.log('   cd server && npm start');
  }
}

// Check if server is running first
const checkServer = http.get('http://localhost:5000', (res) => {
  console.log('🚀 Server is running! Starting tests...');
  console.log('');
  runTests();
});

checkServer.on('error', (err) => {
  console.log('❌ Server is not running!');
  console.log('');
  console.log('Please start the server first:');
  console.log('   cd server && npm start');
  console.log('');
  console.log('Then run this test again.');
  process.exit(1);
});
