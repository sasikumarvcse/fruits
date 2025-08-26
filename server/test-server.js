const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log('Testing route loading...');

// Test each route file individually
try {
  console.log('Loading auth routes...');
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.log('❌ Auth routes error:', error.message);
}

try {
  console.log('Loading user routes...');
  const userRoutes = require('./routes/user');
  app.use('/api/user', userRoutes);
  console.log('✅ User routes loaded');
} catch (error) {
  console.log('❌ User routes error:', error.message);
}

try {
  console.log('Loading items routes...');
  const itemRoutes = require('./routes/items');
  app.use('/api/items', itemRoutes);
  console.log('✅ Items routes loaded');
} catch (error) {
  console.log('❌ Items routes error:', error.message);
}

try {
  console.log('Loading admin routes...');
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.log('❌ Admin routes error:', error.message);
}

try {
  console.log('Loading notifications routes...');
  const notificationRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Notifications routes loaded');
} catch (error) {
  console.log('❌ Notifications routes error:', error.message);
}

try {
  console.log('Loading cart routes...');
  const cartRoutes = require('./routes/cartRoutes');
  app.use('/api/cart', cartRoutes);
  console.log('✅ Cart routes loaded');
} catch (error) {
  console.log('❌ Cart routes error:', error.message);
}

try {
  console.log('Loading wishlist routes...');
  const wishlistRoutes = require('./routes/wishlistRoutes');
  app.use('/api/wishlist', wishlistRoutes);
  console.log('✅ Wishlist routes loaded');
} catch (error) {
  console.log('❌ Wishlist routes error:', error.message);
}

try {
  console.log('Loading orders routes...');
  const ordersRoutes = require('./routes/orders');
  app.use('/api/orders', ordersRoutes);
  console.log('✅ Orders routes loaded');
} catch (error) {
  console.log('❌ Orders routes error:', error.message);
}

try {
  console.log('Loading reviews routes...');
  const reviewsRoutes = require('./routes/reviews');
  app.use('/api/reviews', reviewsRoutes);
  console.log('✅ Reviews routes loaded');
} catch (error) {
  console.log('❌ Reviews routes error:', error.message);
}

try {
  console.log('Loading config routes...');
  const configRoutes = require('./routes/config');
  app.use('/api/config', configRoutes);
  console.log('✅ Config routes loaded');
} catch (error) {
  console.log('❌ Config routes error:', error.message);
}

try {
  console.log('Loading payment routes...');
  const paymentRoutes = require('./routes/payment');
  app.use('/api/payment', paymentRoutes);
  console.log('✅ Payment routes loaded');
} catch (error) {
  console.log('❌ Payment routes error:', error.message);
}

try {
  console.log('Loading delivery routes...');
  const deliveryRoutes = require('./routes/delivery');
  app.use('/api/delivery', deliveryRoutes);
  console.log('✅ Delivery routes loaded');
} catch (error) {
  console.log('❌ Delivery routes error:', error.message);
}

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Test server running at: http://localhost:${PORT}`);
  console.log('✅ Test endpoint: http://localhost:5000/test');
});
