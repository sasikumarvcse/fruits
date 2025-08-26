const mongoose = require('mongoose');
const User = require('./models/User');
const Item = require('./models/Item');

async function testSharedWishlist() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');
    
    // Get a user with wishlist items
    const user = await User.findOne({ 'wishlist.0': { $exists: true } }).populate('wishlist');
    
    if (!user) {
      console.log('No user with wishlist items found');
      return;
    }
    
    console.log(`Testing shared wishlist for user: ${user.email} (${user._id})`);
    console.log(`Wishlist items: ${user.wishlist.length}`);
    
    // Test the shared wishlist endpoint logic
    const sharedUser = await User.findById(user._id).populate('wishlist');
    
    if (!sharedUser) {
      console.log('User not found');
      return;
    }
    
    console.log('\n=== Shared Wishlist Data ===');
    console.log(JSON.stringify(sharedUser.wishlist, null, 2));
    
    // Test the actual endpoint URL
    console.log(`\n=== Test URL ===`);
    console.log(`http://localhost:3000/api/user/${user._id}/wishlist`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testSharedWishlist();
