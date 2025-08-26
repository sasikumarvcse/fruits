const mongoose = require('mongoose');
const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');

async function cleanupCorruptReturnRequests() {
  await mongoose.connect('mongodb://localhost:27017/YOUR_DB_NAME'); // <-- Replace with your DB
  const requests = await ReturnRequest.find();
  let removed = 0;
  for (const req of requests) {
    let hasCorrupt = false;
    if (!req.orderId || !req.itemId || !req.userId) {
      hasCorrupt = true;
    }
    // Check referenced docs exist
    const orderExists = req.orderId ? await Order.exists({ _id: req.orderId }) : false;
    const itemExists = req.itemId ? await Item.exists({ _id: req.itemId }) : false;
    const userExists = req.userId ? await User.exists({ _id: req.userId }) : false;
    if (!orderExists || !itemExists || !userExists) hasCorrupt = true;
    if (hasCorrupt) {
      console.log('Removing corrupt return request:', req._id);
      await ReturnRequest.deleteOne({ _id: req._id });
      removed++;
    }
  }
  console.log(`Cleanup complete. Removed ${removed} corrupt return requests.`);
  process.exit(0);
}
cleanupCorruptReturnRequests(); 