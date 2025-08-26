const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// User profile routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

// Order routes
router.get('/orders', auth, userController.getOrders);
router.post('/orders', auth, userController.placeOrder);

// Address book routes
router.get('/addresses', auth, userController.getAddresses);
router.post('/addresses', auth, userController.addOrUpdateAddress);
router.delete('/addresses', auth, userController.deleteAddress);

// Stub for notification settings endpoint
router.get('/notifications/settings', (req, res) => {
  res.json({
    email: true,
    sms: false,
    push: true
  });
});

// Public: Get a user's wishlist by user ID (for sharing)
router.get('/:userId/wishlist', async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.params.userId).populate('wishlist');
    if (!user) return res.status(404).json([]);
    res.json(user.wishlist);
  } catch (err) {
    res.status(500).json([]);
  }
});

module.exports = router;