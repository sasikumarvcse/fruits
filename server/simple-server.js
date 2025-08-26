const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log('Loading routes...');

// Load all routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const itemRoutes = require('./routes/items');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const ordersRoutes = require('./routes/orders');
const reviewsRoutes = require('./routes/reviews');
const configRoutes = require('./routes/config');
const paymentRoutes = require('./routes/payment');
const deliveryRoutes = require('./routes/delivery');

console.log('Setting up routes...');

// Set up API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);

console.log('Setting up static files...');

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

console.log('Setting up image handler...');

// Import and use image handler middleware
const { imageHandler } = require('./middleware/imageHandler');
app.use('/uploads', imageHandler);

console.log('Setting up catch-all route...');

// Simple catch-all route for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

console.log('Connecting to MongoDB...');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  
  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running at: http://localhost:${PORT}`);
    console.log('🌐 Frontend: http://localhost:5000');
    console.log('🔧 API: http://localhost:5000/api');
    console.log('👑 Admin: http://localhost:5000/admin-login.html');
  });
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});
