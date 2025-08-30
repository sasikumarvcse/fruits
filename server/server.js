const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const session = require('express-session');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for storing pending order details
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 60 * 1000 // 30 minutes
  }
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../client/uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// ✅ API Routes (FIXED - No duplicates)
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
const productRoutes = require('./routes/products');
const invoiceRoutes = require('./routes/invoices');

// Register all API routes (ONLY ONCE)
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
app.use('/api/payment', paymentRoutes); // ✅ Only one payment route
app.use('/api/delivery', deliveryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);

// Serve static files from /client
app.use(express.static(path.join(__dirname, '../client')));

// Image handler middleware
const { imageHandler } = require('./middleware/imageHandler');
app.use('/uploads', imageHandler);

// Serve HTML pages directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/products.html'));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/orders.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/cart.html'));
});

// SPA fallback
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`💳 Razorpay configured: ${process.env.RAZORPAY_KEY_ID ? 'Yes' : 'No'}`);
});
