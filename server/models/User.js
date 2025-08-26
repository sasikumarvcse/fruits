// server/models/User.js
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
  addresses: [
    {
      name: { type: String, required: true },
      mobile: { type: String, required: true },
      address: { type: String, required: true },
      pincode: { type: String, required: true },
      isDefault: { type: Boolean, default: false }
    }
  ],
  // Notification preferences
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

// Add pre-save hook for password hashing
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = Date.now();
  next();
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);