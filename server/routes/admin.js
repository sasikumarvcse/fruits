const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Item = require('../models/Item');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../client/uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Admin login (returns JWT)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: 'admin' });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '5d' });
  res.json({ 
    success: true,
    token, 
    user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } 
  });
});



// Dashboard statistics (FIXED)
router.get('/dashboard', adminAuth, adminController.getDashboardStats);

// Revenue analytics (NEW)
router.get('/revenue', adminAuth, adminController.getRevenueAnalytics);

// Products management with enhanced functionality
router.get('/products', adminAuth, adminController.getProducts);

// Update product status (NEW)
router.patch('/products/:productId/status', adminAuth, adminController.updateProductStatus);

// Bulk update product status (NEW)
router.patch('/products/bulk-status', adminAuth, adminController.bulkUpdateProductStatus);

// Add new product
router.post('/products', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const itemController = require('../controllers/itemController');
    await itemController.createItem(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product
router.put('/products/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const itemController = require('../controllers/itemController');
    await itemController.updateItem(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    const itemController = require('../controllers/itemController');
    await itemController.deleteItem(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Enhanced order management
router.get('/orders', adminAuth, adminController.getOrders);

// Update order status (NEW)
router.patch('/orders/:orderId/status', adminAuth, adminController.updateOrderStatus);

// User management
router.get('/users', adminAuth, adminController.getUsers);

// Update user status (NEW)
router.patch('/users/:userId/status', adminAuth, adminController.updateUserStatus);

// Update user
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Suspend/Activate user
router.patch('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

// Platform Settings Management
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Item.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    // Fixed revenue calculation
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          $or: [
            { status: 'delivered' },
            { status: 'confirmed' },
            { paymentStatus: 'Completed' }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Product summary for admin
router.get('/products/:productId/summary', adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Get product info
    const product = await Item.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Orders containing this product
    const orders = await Order.find({ 'items.item': productId });
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      const productInOrder = order.items.find(p => p.item.toString() === productId);
      return sum + (productInOrder ? productInOrder.price * productInOrder.quantity : 0);
    }, 0);

    // Order status breakdown
    let statusCounts = { delivered: 0, pending: 0, shipped: 0, ordered: 0 };
    orders.forEach(order => {
      if (statusCounts[order.status] !== undefined) statusCounts[order.status]++;
    });

    // Last 5 orders
    const lastOrders = orders.slice(-5).map(o => ({
      id: o._id,
      date: o.createdAt,
      status: o.status,
      amount: o.total
    }));

    res.json({
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        createdAt: product.createdAt
      },
      totalOrders,
      totalRevenue,
      orderStatus: statusCounts,
      lastOrders
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product summary', error: err.message });
  }
});

// Check payment gateway status
router.get('/payment-status', adminAuth, async (req, res) => {
  try {
    // For now, return a simple status since fetch is not available in Node.js
    res.json({ status: 'Connected', message: 'Payment gateway status check available' });
  } catch (error) {
    res.json({ status: 'Error', error: error.message });
  }
});

module.exports = router; 