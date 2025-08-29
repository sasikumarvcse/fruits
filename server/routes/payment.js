const express = require('express');
const router = express.Router();

// GET /api/payment/get-key - Get Razorpay key for frontend
router.get('/get-key', (req, res) => {
    console.log('🔄 Frontend requesting Razorpay key...');
    
    if (!process.env.RAZORPAY_KEY_ID) {
        console.log('❌ RAZORPAY_KEY_ID not found');
        return res.status(503).json({
            success: false,
            message: 'Razorpay key not configured'
        });
    }
    
    console.log('✅ Sending Razorpay key to frontend');
    res.json({
        success: true,
        key: process.env.RAZORPAY_KEY_ID
    });
});

module.exports = router;
