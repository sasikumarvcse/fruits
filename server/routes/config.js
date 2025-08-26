const express = require('express');
const router = express.Router();

// GET /api/config/razorpay - Returns Razorpay key for frontend
router.get('/razorpay', (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID || '' });
});

module.exports = router; 