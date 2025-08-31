const mongoose = require('mongoose');
const User = require('./models/User');
const Item = require('./models/Item');
require('dotenv').config();

async function fixCartIssues() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find();
    console.log(`📊 Found ${users.length} users`);

    let fixedUsers = 0;
    let removedItems = 0;

    for (const user of users) {
      let cartChanged = false;
      const originalCartLength = user.cart.length;

      // Remove cart items with null products
      user.cart = user.cart.filter(item => item.product !== null);

      // Remove cart items with invalid product IDs
      const validCartItems = [];
      for (const item of user.cart) {
        try {
          const product = await Item.findById(item.product);
          if (product) {
            validCartItems.push(item);
          } else {
            console.log(`❌ Removing invalid product ID: ${item.product} from user: ${user.email}`);
            removedItems++;
          }
        } catch (error) {
          console.log(`❌ Error checking product ${item.product}: ${error.message}`);
          removedItems++;
        }
      }

      if (validCartItems.length !== user.cart.length) {
        user.cart = validCartItems;
        cartChanged = true;
      }

      // Fix cart format if needed
      user.cart = user.cart.map(item => {
        if (item.item && !item.product) {
          cartChanged = true;
          return { product: item.item, quantity: item.quantity || 1 };
        }
        return item;
      });

      if (cartChanged) {
        await user.save();
        fixedUsers++;
        console.log(`✅ Fixed cart for user: ${user.email} (${originalCartLength} → ${user.cart.length} items)`);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`- Fixed ${fixedUsers} users`);
    console.log(`- Removed ${removedItems} invalid cart items`);
    console.log(`✅ Cart cleanup completed!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixCartIssues();