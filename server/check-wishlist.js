const mongoose = require('mongoose');
const User = require('./models/User');
const Item = require('./models/Item');

async function checkWishlist() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');
    
    // Check users with wishlist items
    const users = await User.find().populate('wishlist');
    console.log('\n=== Users with Wishlist Items ===');
    let totalWishlistItems = 0;
    
    users.forEach(user => {
      if (user.wishlist && user.wishlist.length > 0) {
        console.log(`User: ${user.email} (${user._id})`);
        console.log(`  Wishlist items: ${user.wishlist.length}`);
        user.wishlist.forEach(item => {
          console.log(`    - ${item.name} (${item._id})`);
        });
        totalWishlistItems += user.wishlist.length;
      }
    });
    
    console.log(`\nTotal wishlist items across all users: ${totalWishlistItems}`);
    
    // Check if there are any products in the database
    const itemCount = await Item.countDocuments();
    console.log(`\nTotal products in database: ${itemCount}`);
    
    if (itemCount === 0) {
      console.log('No products found in database. This might be why wishlist is empty.');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWishlist();
