const mongoose = require('mongoose');
const Item = require('./models/Item');
require('dotenv').config();

async function cleanMalformedReviews() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/groww');
  const items = await Item.find({});
  let cleaned = 0, totalRemoved = 0;
  for (const item of items) {
    const originalCount = item.reviews.length;
    item.reviews = item.reviews.filter(r => r.user && r.rating && r.comment && r.createdAt);
    const removed = originalCount - item.reviews.length;
    if (removed > 0) {
      await item.save();
      cleaned++;
      totalRemoved += removed;
      console.log(`Cleaned ${removed} malformed reviews from item: ${item._id}`);
    }
  }
  console.log(`Cleaned ${totalRemoved} malformed reviews from ${cleaned} items.`);
  process.exit(0);
}

cleanMalformedReviews(); 