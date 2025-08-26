const mongoose = require('mongoose');
const User = require('./models/User');
const Item = require('./models/Item');

async function testWishlistAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');
    
    // Get a user with wishlist items
    const user = await User.findOne({ 'wishlist.0': { $exists: true } }).populate('wishlist');
    
    if (!user) {
      console.log('No user with wishlist items found');
      return;
    }
    
    console.log(`Testing with user: ${user.email} (${user._id})`);
    console.log(`Wishlist items: ${user.wishlist.length}`);
    
    // Test the getWishlist function from userController
    const userController = require('./controllers/userController');
    
    // Mock request and response objects
    const mockReq = {
      user: { id: user._id.toString() }
    };
    
    const mockRes = {
      json: function(data) {
        console.log('API Response:', JSON.stringify(data, null, 2));
        return this;
      },
      status: function(code) {
        console.log(`Status Code: ${code}`);
        return this;
      }
    };
    
    console.log('\n=== Testing getWishlist API ===');
    await userController.getWishlist(mockReq, mockRes);
    
    // Test the shared wishlist endpoint
    console.log('\n=== Testing Shared Wishlist Endpoint ===');
    const sharedReq = {
      params: { userId: user._id.toString() }
    };
    
    const sharedRes = {
      json: function(data) {
        console.log('Shared Wishlist Response:', JSON.stringify(data, null, 2));
        return this;
      },
      status: function(code) {
        console.log(`Shared Wishlist Status Code: ${code}`);
        return this;
      }
    };
    
    // Simulate the shared wishlist endpoint logic
    try {
      const sharedUser = await User.findById(user._id).populate('wishlist');
      if (!sharedUser) {
        sharedRes.status(404).json([]);
      } else {
        sharedRes.json(sharedUser.wishlist);
      }
    } catch (err) {
      sharedRes.status(500).json([]);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testWishlistAPI();
