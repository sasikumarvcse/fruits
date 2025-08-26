const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your_db_name';

async function cleanCarts() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  const users = await User.find({});
  for (const user of users) {
    if (Array.isArray(user.cart)) {
      const originalLength = user.cart.length;
      user.cart = user.cart.filter(c => c.product && mongoose.Types.ObjectId.isValid(c.product));
      if (user.cart.length !== originalLength) {
        await user.save();
        console.log(`Cleaned cart for user ${user._id}`);
      }
    }
  }
  console.log('All user carts cleaned!');
  mongoose.disconnect();
}

cleanCarts().catch(err => {
  console.error('Cart cleaning failed:', err);
  process.exit(1);
}); 