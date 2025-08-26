const mongoose = require('mongoose');
const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');

async function cleanupCorruptOrders() {
  await mongoose.connect('mongodb://localhost:27017/YOUR_DB_NAME'); // <-- Replace with your DB
  const orders = await Order.find();
  let removed = 0;
  for (const order of orders) {
    let hasCorrupt = false;
    if (!order.user || !order.items || !order.total || !order.recipientName || !order.mobile || !order.address || !order.pincode) {
      hasCorrupt = true;
    }
    // Check user exists
    const userExists = order.user ? await User.exists({ _id: order.user }) : false;
    if (!userExists) hasCorrupt = true;
    // Check all items exist
    for (const i of order.items) {
      if (!i.item || !(await Item.exists({ _id: i.item }))) {
        hasCorrupt = true;
        break;
      }
    }
    if (hasCorrupt) {
      console.log('Removing corrupt order:', order._id);
      await Order.deleteOne({ _id: order._id });
      removed++;
    }
  }
  console.log(`Cleanup complete. Removed ${removed} corrupt orders.`);
  process.exit(0);
}
cleanupCorruptOrders(); 