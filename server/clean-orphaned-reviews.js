const mongoose = require('mongoose');
const Item = require('./models/Item');
const User = require('./models/User');
require('dotenv').config();

async function cleanOrphanedReviews() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/groww');
  const items = await Item.find({});
  let cleaned = 0, totalRemoved = 0;
  for (const item of items) {
    const originalCount = item.reviews.length;
    // Check if user exists for each review
    const validReviews = [];
    for (const r of item.reviews) {
      if (!r.user) continue;
      const userExists = await User.exists({ _id: r.user });
      if (userExists) validReviews.push(r);
    }
    const removed = originalCount - validReviews.length;
    if (removed > 0) {
      item.reviews = validReviews;
      await item.save();
      cleaned++;
      totalRemoved += removed;
      console.log(`Removed ${removed} orphaned reviews from item: ${item._id}`);
    }
  }
  console.log(`Removed ${totalRemoved} orphaned reviews from ${cleaned} items.`);
  process.exit(0);
}

cleanOrphanedReviews(); 