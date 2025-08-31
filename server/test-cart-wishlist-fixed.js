const axios = require('axios');

async function testCartWishlist() {
  try {
    console.log('🧪 Testing Cart and Wishlist functionality...\n');

    // Test 1: Get products
    console.log('1️⃣ Testing product retrieval...');
    const productsResponse = await axios.get('http://localhost:3000/api/items');
    const products = productsResponse.data;
    console.log(`✅ Found ${products.length} products`);
    
    if (products.length === 0) {
      console.log('❌ No products found. Please add some products first.');
      return;
    }

    const testProduct = products[0];
    console.log(`📦 Using product: ${testProduct.name} (ID: ${testProduct._id})`);

    // Test 2: Login (you'll need to replace with actual credentials)
    console.log('\n2️⃣ Testing authentication...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'sasikumar54vcse@gmail.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test 3: Add to cart
    console.log('\n3️⃣ Testing add to cart...');
    const addToCartResponse = await axios.post('http://localhost:3000/api/cart/add', {
      itemId: testProduct._id,
      quantity: 1
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Add to cart successful');
    console.log('Cart items:', addToCartResponse.data.length);

    // Test 4: Get cart
    console.log('\n4️⃣ Testing get cart...');
    const getCartResponse = await axios.get('http://localhost:3000/api/cart', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Get cart successful');
    console.log('Cart items:', getCartResponse.data.length);
    
    // Check if products are populated
    const cartItems = getCartResponse.data;
    const nullProducts = cartItems.filter(item => item.product === null);
    if (nullProducts.length > 0) {
      console.log('⚠️  Found cart items with null products:', nullProducts.length);
    } else {
      console.log('✅ All cart items have valid products');
    }

    // Test 5: Add to wishlist
    console.log('\n5️⃣ Testing add to wishlist...');
    const addToWishlistResponse = await axios.post('http://localhost:3000/api/wishlist/add', {
      itemId: testProduct._id
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Add to wishlist successful');

    // Test 6: Get wishlist
    console.log('\n6️⃣ Testing get wishlist...');
    const getWishlistResponse = await axios.get('http://localhost:3000/api/wishlist', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Get wishlist successful');
    console.log('Wishlist items:', getWishlistResponse.data.length);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCartWishlist();