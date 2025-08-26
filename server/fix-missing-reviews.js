const mongoose = require('mongoose');
const Item = require('./models/Item');
require('dotenv').config();

async function fixMissingReviews() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/groww');
  const items = await Item.find({ $or: [ { reviews: { $exists: false } }, { reviews: null } ] });
  let fixed = 0;
  for (const item of items) {
    item.reviews = [];
    await item.save();
    fixed++;
    console.log(`Fixed item: ${item._id}`);
  }
  console.log(`Fixed ${fixed} items.`);
  process.exit(0);
}

fixMissingReviews(); 