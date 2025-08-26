const express = require('express');
const Razorpay = require('razorpay');
const router = express.Router();

// Initialize Razorpay only if keys are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.log('⚠️ Razorpay keys not configured - payment features will be disabled');
}

router.post('/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ message: 'Payment service not configured' });
    }
    
    const options = {
      amount: req.body.amount * 100, // Amount in paise
      currency: 'INR',
      receipt: 'receipt_order_' + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).send('Error creating order: ' + err.message);
  }
});

module.exports = router; 