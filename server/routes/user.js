const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET /api/user/profile - Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, mobile, address } = req.body;
        const updateData = {};
        
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (mobile) updateData.mobile = mobile;
        if (address) updateData.address = address;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json(user);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/user/addresses - Get user addresses
router.get('/addresses', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.addresses || []);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/user/addresses - Add new address
router.post('/addresses', auth, async (req, res) => {
    try {
        const { recipientName, mobile, address, pincode, city, state, addressType, isDefault } = req.body;
        
        if (!recipientName || !mobile || !address || !pincode || !city || !state) {
            return res.status(400).json({ message: 'All required fields are required' });
        }
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // If setting as default, unset other addresses as default
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }
        
        const newAddress = {
            name: recipientName,
            recipientName,
            mobile,
            address,
            pincode,
            city,
            state,
            addressType: addressType || 'home',
            isDefault: isDefault || user.addresses.length === 0
        };
        
        user.addresses.push(newAddress);
        await user.save();
        
        res.status(201).json(newAddress);
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/user/addresses/:addressId - Update address
router.put('/addresses/:addressId', auth, async (req, res) => {
    try {
        const { addressId } = req.params;
        const { recipientName, mobile, address, pincode, city, state, addressType, isDefault } = req.body;
        
        if (!addressId) {
            return res.status(400).json({ message: 'Address ID is required' });
        }
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }
        
        // If setting as default, unset other addresses as default
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }
        
        if (recipientName) user.addresses[addressIndex].recipientName = recipientName;
        if (mobile) user.addresses[addressIndex].mobile = mobile;
        if (address) user.addresses[addressIndex].address = address;
        if (pincode) user.addresses[addressIndex].pincode = pincode;
        if (city) user.addresses[addressIndex].city = city;
        if (state) user.addresses[addressIndex].state = state;
        if (addressType) user.addresses[addressIndex].addressType = addressType;
        if (typeof isDefault === 'boolean') user.addresses[addressIndex].isDefault = isDefault;
        
        await user.save();
        res.json(user.addresses[addressIndex]);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/user/addresses/:addressId - Delete address
router.delete('/addresses/:addressId', auth, async (req, res) => {
    try {
        const { addressId } = req.params;
        
        if (!addressId) {
            return res.status(400).json({ message: 'Address ID is required' });
        }
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }
        
        user.addresses.splice(addressIndex, 1);
        await user.save();
        
        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/user/password - Change password
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both passwords are required' });
        }
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        user.password = newPassword;
        await user.save();
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
