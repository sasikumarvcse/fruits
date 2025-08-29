// server/models/User.js - FIXED VERSION
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'delivery'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        default: []
    }],
    cart: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        quantity: { type: Number, default: 1 }
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: []
    }],
    // ✅ FIXED: Single addresses definition with all required fields
    addresses: [{
        name: { type: String, required: true },
        recipientName: { type: String, required: true },
        mobile: { type: String, required: true },
        address: { type: String, required: true },
        pincode: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    }],
    notificationPreferences: {
        order: { type: Boolean, default: true },
        offer: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        admin: { type: Boolean, default: true }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook with isModified check
userSchema.pre('save', async function(next) {
    try {
        if (this.isModified('password')) {
            console.log('🔒 Hashing password for user:', this.email);
            this.password = await bcrypt.hash(this.password, 10);
            console.log('✅ Password hashed successfully');
        }
        this.updatedAt = Date.now();
        next();
    } catch (error) {
        console.error('❌ Error in pre-save hook:', error);
        next(error);
    }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// comparePassword method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        console.log('🔍 Comparing passwords for user:', this.email);
        const result = await bcrypt.compare(candidatePassword, this.password);
        console.log('🔒 Password comparison result:', result);
        return result;
    } catch (error) {
        console.error('❌ Error comparing passwords:', error);
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);
