const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Item = require('../models/Item');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Delivery Man Signup
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, avatar } = req.body;
    if (!firstName || !email || !password) return res.status(400).json({ message: 'All fields required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ firstName, lastName, email, password: hashed, role: 'delivery', avatar });
    await user.save();
    res.status(201).json({ message: 'Signup successful' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Delivery Man Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'delivery' });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ user: { id: user._id, role: user.role } }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, avatar: user.avatar } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get all products for delivery men
router.get('/products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') return res.status(403).json({ message: 'Forbidden' });
    const products = await Item.find()
      
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Update product status when delivery man arrives
router.patch('/products/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') return res.status(403).json({ message: 'Forbidden' });
    const { status, notes } = req.body;
    const product = await Item.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Add delivery status tracking
    if (!product.deliveryStatus) product.deliveryStatus = [];
    product.deliveryStatus.push({
      status,
      notes,
      deliveryMan: req.user.id,
      timestamp: new Date()
    });
    
    await product.save();
    res.json({ message: 'Product status updated', product });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get assigned orders
router.get('/orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') return res.status(403).json({ message: 'Forbidden' });
    const orders = await Order.find({ deliveryMan: req.user.id })
      .populate('items.item')
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Update order status
router.patch('/orders/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') return res.status(403).json({ message: 'Forbidden' });
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, deliveryMan: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status;
    await order.save();
    res.json({ message: 'Order status updated', order });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router; 