const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config();

async function migrateOrdersTimeline() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/groww');
    console.log('Connected to MongoDB');

    // Get all orders without timeline
    const orders = await Order.find({ orderTimeline: { $exists: false } });
    console.log(`Found ${orders.length} orders to migrate`);

    for (const order of orders) {
      // Create initial timeline entry based on current status
      const timelineEntry = {
        status: order.status,
        timestamp: order.createdAt,
        description: getStatusDescription(order.status),
        updatedBy: order.user
      };

      // Add timeline to order
      order.orderTimeline = [timelineEntry];
      await order.save();
      console.log(`Migrated order ${order._id}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

function getStatusDescription(status) {
  const descriptions = {
    'pending': 'Order placed and pending confirmation',
    'paid': 'Payment received and order confirmed',
    'shipped': 'Order has been shipped from warehouse',
    'out_for_delivery': 'Order is out for delivery',
    'delivered': 'Order has been delivered successfully',
    'cancelled': 'Order has been cancelled',
    'failed': 'Order placement failed'
  };
  return descriptions[status] || `Order status: ${status}`;
}

migrateOrdersTimeline(); 