const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log('🚀 Starting minimal server for Razorpay testing...');

// Minimal payment route for Razorpay key
app.get('/api/payment/get-key', (req, res) => {
    console.log('🔑 Frontend requesting Razorpay key...');
    
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

// Minimal order creation route
app.post('/api/orders/razorpay/create-order', (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }
        
        console.log(`💰 Creating order for amount: ₹${amount} (${amount * 100} paise)`);
        
        // Create a mock order for testing
        const mockOrder = {
            id: 'order_mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            amount: Math.round(amount * 100), // Ensure exact amount in paise
            currency: currency,
            status: 'created',
            receipt: 'order_' + Date.now(),
            amount_in_rupees: amount.toFixed(2)
        };
        
        console.log('✅ Mock order created:', mockOrder);
        res.json(mockOrder);
        
    } catch (error) {
        console.error('❌ Order creation error:', error);
        res.status(500).json({ message: error.message || 'Failed to create payment order' });
    }
});

// Minimal payment verification route
app.post('/api/orders/razorpay/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, realOrderDetails } = req.body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed' });
        }
        
        console.log('✅ Payment verification successful (mock)');
        console.log('Order details:', realOrderDetails);
        
        res.status(201).json({ 
            success: true, 
            message: 'Order placed successfully', 
            order: {
                _id: 'order_' + Date.now(),
                ...realOrderDetails,
                status: 'confirmed',
                paymentStatus: 'Completed'
            }
        });
        
    } catch (error) {
        console.error('❌ Payment verification error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Test route
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Minimal server is running!',
        razorpay_configured: !!process.env.RAZORPAY_KEY_ID,
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Minimal server running at: http://localhost:${PORT}`);
    console.log(`🔑 Razorpay key: ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'NOT CONFIGURED'}`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
    console.log(`💳 Payment API: http://localhost:${PORT}/api/payment/get-key`);
});

console.log('✅ Minimal server setup complete');