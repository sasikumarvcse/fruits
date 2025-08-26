const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get notifications for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const prefs = user?.notificationPreferences || {};
    const enabledTypes = Object.entries(prefs).filter(([k, v]) => v).map(([k]) => k);
    const notifications = await Notification.find({ user: req.user._id, type: { $in: enabledTypes } }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a notification
router.post('/', auth, async (req, res) => {
  try {
    const { user, message, type } = req.body;
    const notification = new Notification({ user, message, type });
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ success: true });
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Admin: send offer/promo notification to all or targeted users/sellers
router.post('/admin/send-offer', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const { message, targetRole = 'user', icon = 'fa-tag' } = req.body;
    // For demo: create one notification per user/seller, or global if targetRole === 'all'
    let users = [];
    if (targetRole === 'user') {
      users = await require('../models/User').find({ role: 'user' });
    } else if (targetRole === 'admin') {
      users = await require('../models/User').find({ role: 'admin' });
    } else if (targetRole === 'all') {
      users = await require('../models/User').find({});
    }
    if (users.length) {
      await Promise.all(users.map(u =>
        Notification.create({ user: u._id, message, type: 'offer', icon, targetRole })
      ));
    } else {
      // Global notification (no user field)
      await Notification.create({ message, type: 'offer', icon, targetRole });
    }
    res.json({ message: 'Offer notification sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get admin notifications
router.get('/admin', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findById(req.user._id);
    const prefs = user?.notificationPreferences || {};
    const enabledTypes = Object.entries(prefs).filter(([k, v]) => v).map(([k]) => k);
    const notifications = await Notification.find({ targetRole: { $in: ['admin', 'all'] }, type: { $in: enabledTypes } }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get admin notifications
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findById(req.user._id);
    const prefs = user?.notificationPreferences || {};
    const enabledTypes = Object.entries(prefs).filter(([k, v]) => v).map(([k]) => k);
    const notifications = await Notification.find({ $or: [
      { user: req.user._id },
      { targetRole: { $in: ['admin', 'all'] } }
    ], type: { $in: enabledTypes } }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Notification settings (persisted)
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.notificationPreferences || { order: true, offer: true, system: true, admin: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.patch('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...req.body
    };
    await user.save();
    res.json(user.notificationPreferences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 