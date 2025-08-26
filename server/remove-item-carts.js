const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your_db_name';

async function removeItemCarts() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  const users = await User.find({ "cart.item": { $exists: true } });
  for (const user of users) {
    const originalLength = user.cart.length;
    user.cart = user.cart.filter(c => !c.item);
    if (user.cart.length !== originalLength) {
      await user.save();
      console.log(`Removed all 'item' cart entries for user ${user._id}`);
    }
  }
  console.log('All user carts with item field cleaned!');
  mongoose.disconnect();
}

removeItemCarts().catch(err => {
  console.error('Cart cleaning failed:', err);
  process.exit(1);
}); 