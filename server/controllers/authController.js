const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// ✅ FIXED: Admin Login Function (Single Clean Version)
exports.adminLogin = async (req, res) => {
    try {
        console.log('🔄 Admin login attempt started');
        const { email, password } = req.body;
        
        console.log('📧 Login attempt for:', email);

        // Validate input
        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find admin user
        const admin = await User.findOne({ 
            email: email.toLowerCase(),
            role: 'admin'
        });

        console.log('👤 Admin found:', admin ? 'YES' : 'NO');

        if (!admin) {
            console.log('❌ Admin not found for email:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Verify password
        const isValidPassword = await admin.comparePassword(password);
        console.log('🔒 Password valid:', isValidPassword);

        if (!isValidPassword) {
            console.log('❌ Invalid password for admin:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }

        // Generate JWT token with consistent secret
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const payload = {
            user: {
                id: admin.id,
                role: admin.role
            }
        };

        const token = jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Admin login successful for:', email);

        res.json({
            success: true,
            message: 'Admin login successful',
            token,
            user: {
                id: admin._id,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('❌ Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during admin login'
        });
    }
};

// User Registration
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log('Registration attempt:', req.body);
        const { firstName, lastName, email, password, mobile } = req.body;
        const role = 'user';

        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        existingUser = await User.findOne({ mobile });
        if (existingUser) {
            return res.status(400).json({ message: 'Mobile number already exists' });
        }

        const user = new User({
            firstName,
            lastName,
            email,
            password,
            role,
            mobile
        });

        await user.save();

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    token,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role,
                        mobile: user.mobile,
                        address: user.address
                    }
                });
            }
        );

    } catch (err) {
        console.error('Register Error:', err.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// User Login
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role,
                        mobile: user.mobile,
                        address: user.address
                    }
                });
            }
        );

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};
