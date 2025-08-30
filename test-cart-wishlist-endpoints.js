const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'test123'
};

let authToken = '';

// Test functions
async function testLogin() {
  try {
    console.log('🔐 Testing login...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful, token received');
      return true;
    } else {
      console.log('❌ Login failed - no token received');
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

async function testCartEndpoints() {
  if (!authToken) {
    console.log('❌ No auth token, skipping cart tests');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('\n🛒 Testing cart endpoints...');
    
    // Test get cart
    console.log('📋 Testing GET /api/cart...');
    const getCartResponse = await axios.get(`${BASE_URL}/api/cart`, { headers });
    console.log('✅ GET /api/cart successful:', getCartResponse.data);
    
    // Test add to cart
    console.log('➕ Testing POST /api/cart/add...');
    const addToCartResponse = await axios.post(`${BASE_URL}/api/cart/add`, {
      itemId: '507f1f77bcf86cd799439011', // Test ObjectId
      quantity: 1
    }, { headers });
    console.log('✅ POST /api/cart/add successful:', addToCartResponse.data);
    
    // Test update cart
    console.log('✏️ Testing PUT /api/cart/update...');
    const updateCartResponse = await axios.put(`${BASE_URL}/api/cart/update`, {
      itemId: '507f1f77bcf86cd799439011',
      quantity: 2
    }, { headers });
    console.log('✅ PUT /api/cart/update successful:', updateCartResponse.data);
    
    // Test remove from cart
    console.log('🗑️ Testing POST /api/cart/remove...');
    const removeFromCartResponse = await axios.post(`${BASE_URL}/api/cart/remove`, {
      itemId: '507f1f77bcf86cd799439011'
    }, { headers });
    console.log('✅ POST /api/cart/remove successful:', removeFromCartResponse.data);
    
    // Test clear cart
    console.log('🧹 Testing POST /api/cart/clear...');
    const clearCartResponse = await axios.post(`${BASE_URL}/api/cart/clear`, {}, { headers });
    console.log('✅ POST /api/cart/clear successful:', clearCartResponse.data);
    
  } catch (error) {
    console.error('❌ Cart endpoint error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

async function testWishlistEndpoints() {
  if (!authToken) {
    console.log('❌ No auth token, skipping wishlist tests');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('\n❤️ Testing wishlist endpoints...');
    
    // Test get wishlist
    console.log('📋 Testing GET /api/wishlist...');
    const getWishlistResponse = await axios.get(`${BASE_URL}/api/wishlist`, { headers });
    console.log('✅ GET /api/wishlist successful:', getWishlistResponse.data);
    
    // Test add to wishlist
    console.log('➕ Testing POST /api/wishlist/add...');
    const addToWishlistResponse = await axios.post(`${BASE_URL}/api/wishlist/add`, {
      itemId: '507f1f77bcf86cd799439011' // Test ObjectId
    }, { headers });
    console.log('✅ POST /api/wishlist/add successful:', addToWishlistResponse.data);
    
    // Test remove from wishlist
    console.log('🗑️ Testing POST /api/wishlist/remove...');
    const removeFromWishlistResponse = await axios.post(`${BASE_URL}/api/wishlist/remove`, {
      itemId: '507f1f77bcf86cd799439011'
    }, { headers });
    console.log('✅ POST /api/wishlist/remove successful:', removeFromWishlistResponse.data);
    
  } catch (error) {
    console.error('❌ Wishlist endpoint error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

async function testServerStatus() {
  try {
    console.log('🏥 Testing server status...');
    const response = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting cart and wishlist endpoint tests...\n');
  
  // Check if server is running
  const serverRunning = await testServerStatus();
  if (!serverRunning) {
    console.log('❌ Cannot proceed without server running');
    return;
  }
  
  // Test login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without successful login');
    return;
  }
  
  // Test cart endpoints
  await testCartEndpoints();
  
  // Test wishlist endpoints
  await testWishlistEndpoints();
  
  console.log('\n🎉 All tests completed!');
}

// Run tests
runTests().catch(console.error);