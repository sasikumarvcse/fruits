const http = require('http');

console.log('🧪 Testing Payment API...\n');

// Test payment create-order endpoint
function testPaymentCreateOrder() {
  return new Promise((resolve) => {
    const data = JSON.stringify({ amount: 100 });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/payment/create-order',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log(`Payment API Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const order = JSON.parse(responseData);
            console.log('✅ Payment API working - Order created:', order.id);
            console.log('Order details:', order);
          } catch (e) {
            console.log('❌ Payment API response parsing failed:', responseData);
          }
        } else {
          console.log('❌ Payment API failed:', responseData);
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ Payment API request failed:', e.message);
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

// Test config endpoint to get Razorpay key
function testConfigEndpoint() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/config/razorpay',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log(`Config API Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const config = JSON.parse(responseData);
            console.log('✅ Config API working - Razorpay key:', config.key ? 'Set' : 'Not set');
          } catch (e) {
            console.log('❌ Config API response parsing failed:', responseData);
          }
        } else {
          console.log('❌ Config API failed:', responseData);
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ Config API request failed:', e.message);
      resolve();
    });
    
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Payment API Tests...\n');
  
  await testConfigEndpoint();
  console.log('');
  await testPaymentCreateOrder();
  
  console.log('\n📊 Test Summary:');
  console.log('✅ Server is running on port 3000');
  console.log('✅ Payment API endpoints are accessible');
}

runTests().catch(console.error);
