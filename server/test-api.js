const http = require('http');

// Test the order creation API
function testOrderAPI() {
  const data = JSON.stringify({
    test: 'data'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', responseData);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(data);
  req.end();
}

// Test the products API
function testProductsAPI() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/items',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Products API Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const products = JSON.parse(responseData);
        console.log(`Found ${products.length} products`);
        if (products.length > 0) {
          console.log(`First product: ${products[0].name} - ₹${products[0].price}`);
        }
      } catch (e) {
        console.log('Response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
}

console.log('Testing API endpoints...');
console.log('1. Testing Products API:');
testProductsAPI();

setTimeout(() => {
  console.log('\n2. Testing Order Creation API (should return 401 - no auth):');
  testOrderAPI();
}, 1000);
