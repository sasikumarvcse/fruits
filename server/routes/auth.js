const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// Auth Validators
const registerValidator = [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('mobile', 'Please provide a valid mobile number').not().isEmpty(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];

const loginValidator = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
];

const adminLoginValidator = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
];

// Auth Routes
router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/admin-login', adminLoginValidator, authController.adminLogin);

// Profile Routes
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

module.exports = router;
