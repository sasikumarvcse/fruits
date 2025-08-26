const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer'); // Add multer for file uploads

dotenv.config();

// Set environment variables if not present
process.env.PORT = process.env.PORT || 3000;
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/arobowl';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7A8B9C0D1E2F3';
// Razorpay live keys for secure payment processing  
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_gBP9geXusrKWUg';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'hCpyTv9AiSrMWONnsFu8dSs0';

const app = express();

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../client/uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ✅ API routes
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

// ✅ Serve static files from /client (should be after API routes)
app.use(express.static(path.join(__dirname, '../client')));

// Import image handler middleware
const { imageHandler } = require('./middleware/imageHandler');

// Use image handler middleware for uploads
app.use('/uploads', imageHandler);

// SPA fallback - handle all non-API routes
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Skip static files that exist
  if (req.path.includes('.')) {
    return next();
  }
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ✅ DB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
  console.log(`✅ Server also accessible at: http://0.0.0.0:${PORT}`);
});