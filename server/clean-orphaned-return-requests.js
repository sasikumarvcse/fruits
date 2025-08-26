const mongoose = require('mongoose');
const ReturnRequest = require('./models/ReturnRequest');
const Order = require('./models/Order');
const Item = require('./models/Item');
const User = require('./models/User');
require('dotenv').config();

async function cleanOrphanedReturnRequests() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/groww');
  const requests = await ReturnRequest.find({});
  let removed = 0;
  for (const req of requests) {
    const orderExists = await Order.exists({ _id: req.orderId });
    const itemExists = await Item.exists({ _id: req.itemId });
    const userExists = await User.exists({ _id: req.userId });
    if (!orderExists || !itemExists || !userExists) {
      await req.deleteOne();
      removed++;
      console.log(`Removed orphaned return request: ${req._id}`);
    }
  }
  console.log(`Removed ${removed} orphaned return requests.`);
  process.exit(0);
}

cleanOrphanedReturnRequests(); 