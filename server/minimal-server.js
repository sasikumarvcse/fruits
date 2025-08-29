const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

console.log('🚀 Starting comprehensive e-commerce server...');

// Import models
const User = require('./models/User');
const Item = require('./models/Item');
const Order = require('./models/Order');
const Notification = require('./models/Notification');

// Simple auth middleware
const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Admin middleware
const adminAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ===== AUTHENTICATION ROUTES =====
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { _id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, mobile } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        
        const user = new User({
            firstName,
            lastName,
            email,
            password,
            mobile
        });
        
        await user.save();
        
        const token = jwt.sign(
            { _id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Signup failed' });
    }
});

// ===== USER ROUTES =====
app.get('/api/user/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
});

app.put('/api/user/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, mobile } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { firstName, lastName, mobile },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

app.get('/api/user/addresses', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user.addresses || []);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch addresses' });
    }
});

app.post('/api/user/addresses', auth, async (req, res) => {
    try {
        const { recipientName, mobile, address, pincode, name } = req.body;
        const user = await User.findById(req.user._id);
        
        const newAddress = {
            name: name || recipientName,
            recipientName,
            mobile,
            address,
            pincode,
            isDefault: user.addresses.length === 0
        };
        
        user.addresses.push(newAddress);
        await user.save();
        res.status(201).json(newAddress);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add address' });
    }
});

app.put('/api/user/addresses', auth, async (req, res) => {
    try {
        const { addressId, recipientName, mobile, address, pincode, name } = req.body;
        const user = await User.findById(req.user._id);
        
        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }
        
        if (recipientName) user.addresses[addressIndex].recipientName = recipientName;
        if (mobile) user.addresses[addressIndex].mobile = mobile;
        if (address) user.addresses[addressIndex].address = address;
        if (pincode) user.addresses[addressIndex].pincode = pincode;
        if (name) user.addresses[addressIndex].name = name;
        
        await user.save();
        res.json(user.addresses[addressIndex]);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update address' });
    }
});

app.delete('/api/user/addresses', auth, async (req, res) => {
    try {
        const { addressId } = req.body;
        const user = await User.findById(req.user._id);
        
        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }
        
        user.addresses.splice(addressIndex, 1);
        await user.save();
        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete address' });
    }
});

// ===== PRODUCTS/ITEMS ROUTES =====
app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find({ stock: { $gt: 0 } });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

app.get('/api/items/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product' });
    }
});

// ===== CART ROUTES =====
app.get('/api/cart', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('cart.product');
        res.json(user.cart || []);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch cart' });
    }
});

app.post('/api/cart/add', auth, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const user = await User.findById(req.user._id);
        
        const existingItem = user.cart.find(item => item.product.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.cart.push({ product: productId, quantity });
        }
        
        await user.save();
        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add to cart' });
    }
});

app.put('/api/cart/update', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const user = await User.findById(req.user._id);
        
        const cartItem = user.cart.find(item => item.product.toString() === productId);
        if (cartItem) {
            cartItem.quantity = quantity;
        }
        
        await user.save();
        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update cart' });
    }
});

app.post('/api/cart/remove', auth, async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user._id);
        
        user.cart = user.cart.filter(item => item.product.toString() !== productId);
        await user.save();
        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove from cart' });
    }
});

// ===== WISHLIST ROUTES =====
app.get('/api/wishlist', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        res.json(user.wishlist || []);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch wishlist' });
    }
});

app.post('/api/wishlist', auth, async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user._id);
        
        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
        }
        
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add to wishlist' });
    }
});

app.delete('/api/wishlist/:productId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
        await user.save();
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove from wishlist' });
    }
});

// ===== ORDERS ROUTES =====
app.get('/api/orders/user', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).populate('items.item');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

app.get('/api/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.item');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (req.user.role !== 'admin' && order.user.toString() !== req.user._id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch order' });
    }
});

// ===== ADMIN ROUTES =====
app.get('/api/admin/dashboard', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Item.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        
        res.json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
});

app.get('/api/admin/products', adminAuth, async (req, res) => {
    try {
        const products = await Item.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

app.get('/api/admin/orders', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'firstName lastName email').populate('items.item');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

app.patch('/api/admin/users/:userId/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { status },
            { new: true }
        ).select('-password');
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user status' });
    }
});

app.patch('/api/orders/:orderId/status', auth, async (req, res) => {
    try {
        const { status, description } = req.body;
        const order = await Order.findById(req.params.orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (req.user.role !== 'admin' && order.user.toString() !== req.user._id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        order.status = status;
        if (description) {
            order.orderTimeline.push({
                status,
                timestamp: new Date(),
                description,
                updatedBy: req.user._id
            });
        }
        
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order status' });
    }
});

// ===== NOTIFICATIONS ROUTES =====
app.get('/api/notifications', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

app.patch('/api/notifications/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark notification as read' });
    }
});

// ===== RAZORPAY ROUTES =====
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

app.post('/api/orders/razorpay/create-order', auth, async (req, res) => {
    try {
        const { amount, currency = 'INR', productId, quantity, deliveryAddress } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }
        
        console.log(`💰 Creating order for amount: ₹${amount} (${amount * 100} paise)`);
        console.log('📦 Order details:', { productId, quantity, deliveryAddress });
        
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

app.post('/api/orders/razorpay/verify-payment', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, realOrderDetails } = req.body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed' });
        }
        
        console.log('✅ Payment verification successful (mock)');
        console.log('Order details:', realOrderDetails);
        
        // Create the actual order
        const order = new Order({
            user: req.user._id,
            items: realOrderDetails.items || [{
                item: realOrderDetails.productId,
                quantity: realOrderDetails.quantity
            }],
            total: realOrderDetails.total,
            recipientName: realOrderDetails.recipientName,
            mobile: realOrderDetails.mobile,
            address: realOrderDetails.address,
            pincode: realOrderDetails.pincode,
            status: 'confirmed',
            paymentMethod: 'Razorpay',
            paymentStatus: 'Completed',
            paymentId: razorpay_payment_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            orderTimeline: [{
                status: 'placed',
                timestamp: new Date(),
                description: 'Order placed successfully',
                updatedBy: req.user._id
            }]
        });
        
        await order.save();
        
        // Add order to user's orders array
        const user = await User.findById(req.user._id);
        if (user) {
            user.orders.push(order._id);
            await user.save();
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Order placed successfully', 
            order
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
        message: 'Comprehensive e-commerce server is running!',
        razorpay_configured: !!process.env.RAZORPAY_KEY_ID,
        features: [
            'Authentication (Login/Signup)',
            'User Management',
            'Product Management',
            'Cart & Wishlist',
            'Order Processing',
            'Razorpay Integration',
            'Admin Dashboard',
            'Address Management'
        ],
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start server
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected successfully');
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Comprehensive e-commerce server running at: http://localhost:${PORT}`);
        console.log(`🔑 Razorpay key: ${process.env.RAZORPAY_KEY_ID ? 'Configured' : 'NOT CONFIGURED'}`);
        console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
        console.log(`💳 Payment API: http://localhost:${PORT}/api/payment/get-key`);
        console.log(`👑 Admin Dashboard: http://localhost:${PORT}/admin-dashboard.html`);
        console.log(`🛒 User Dashboard: http://localhost:${PORT}/user-dashboard.html`);
        console.log(`🥗 Products: http://localhost:${PORT}/products.html`);
    });
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

console.log('✅ Comprehensive e-commerce server setup complete');