const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Item = require('../models/Item');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');

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


const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Admin login (returns JWT)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: 'admin' });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ user: { id: user.id, role: user.role } }, JWT_SECRET, { expiresIn: '5d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } });
});

// Middleware: require admin JWT
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Fix: Check payload.user.role instead of payload.role
    if (payload.user && payload.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    req.user = payload.user || payload; // Handle both structures
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token invalid' });
  }
}

// Dashboard stats
router.get('/dashboard', requireAdmin, async (req, res) => {
    console.log('[ADMIN DASHBOARD] User:', req.user);
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Item.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    console.log('[ADMIN DASHBOARD] Stats:', { totalUsers, totalProducts, totalOrders, totalRevenue: totalRevenue[0]?.total || 0 });
    res.json({ 
      totalUsers, 
      totalProducts, 
      totalOrders, 
      totalRevenue: totalRevenue[0]?.total || 0 
    });
});

// Products management (paginated)
router.get('/products', requireAdmin, async (req, res) => {
  try {
    let { page = 1, limit = 10, search = '', category = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Item.countDocuments(query);
    const products = await Item.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Update product
router.put('/products/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product
router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Toggle product status (suspend/activate)
router.patch('/products/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Item.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating status' });
  }
});
// Orders management (stubs)
router.get('/orders', requireAdmin, async (req, res) => {
  const orders = await Order.find().populate('user').populate('items.item');
  res.json(orders);
});
// Update order status (admin)
router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Order not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating order status' });
  }
});
// Users management (paginated)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    let { page = 1, limit = 10, search = '', role = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const query = { };
    if (role) query.role = role;
    else query.role = { $in: ['user', 'admin'] };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});
// Update user
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user' });
  }
});
// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});
// Suspend/Activate user
router.patch('/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

// Add new product
router.post('/products', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const itemController = require('../controllers/itemController');
    await itemController.createItem(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product
router.put('/products/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const itemController = require('../controllers/itemController');
    await itemController.updateItem(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product
router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const itemController = require('../controllers/itemController');
    await itemController.deleteItem(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// --- Platform Settings Management ---
// Get platform statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Item.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
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
router.get('/products/:productId/summary', requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const Item = require('../models/Item');
    const Order = require('../models/Order');

    // Get product info
    const product = await Item.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Orders containing this product
    const orders = await Order.find({ 'products.item': productId });
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      const productInOrder = order.products.find(p => p.item.toString() === productId);
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

module.exports = router; 