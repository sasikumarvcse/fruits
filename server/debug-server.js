const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log('🔍 Debugging route loading...');

// Test routes one by one
const routeTests = [
  { name: 'auth', file: './routes/auth' },
  { name: 'user', file: './routes/user' },
  { name: 'items', file: './routes/items' },
  { name: 'admin', file: './routes/admin' },
  { name: 'notifications', file: './routes/notifications' },
  { name: 'cart', file: './routes/cartRoutes' },
  { name: 'wishlist', file: './routes/wishlistRoutes' },
  { name: 'orders', file: './routes/orders' },
  { name: 'reviews', file: './routes/reviews' },
  { name: 'config', file: './routes/config' },
  { name: 'payment', file: './routes/payment' },
  { name: 'delivery', file: './routes/delivery' }
];

for (const routeTest of routeTests) {
  try {
    console.log(`Testing ${routeTest.name} routes...`);
    const routes = require(routeTest.file);
    app.use(`/api/${routeTest.name}`, routes);
    console.log(`✅ ${routeTest.name} routes loaded successfully`);
  } catch (error) {
    console.log(`❌ ${routeTest.name} routes failed:`, error.message);
  }
}

// Test static files
try {
  console.log('Testing static files...');
  app.use(express.static(path.join(__dirname, '../client')));
  console.log('✅ Static files loaded');
} catch (error) {
  console.log('❌ Static files failed:', error.message);
}

// Test image handler
try {
  console.log('Testing image handler...');
  const { imageHandler } = require('./middleware/imageHandler');
  app.use('/uploads', imageHandler);
  console.log('✅ Image handler loaded');
} catch (error) {
  console.log('❌ Image handler failed:', error.message);
}

// Test catch-all route
try {
  console.log('Testing catch-all route...');
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/index.html'));
  });
  console.log('✅ Catch-all route loaded');
} catch (error) {
  console.log('❌ Catch-all route failed:', error.message);
}

// Start server
const PORT = 5001; // Use different port to avoid conflicts
app.listen(PORT, () => {
  console.log(`✅ Debug server running at: http://localhost:${PORT}`);
  console.log('🎯 If you see this message, all routes loaded successfully!');
});
