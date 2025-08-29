const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      },
      reviewed: {
        type: Boolean,
        default: false
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  // Legacy field for backward compatibility
  total: {
    type: Number,
    required: false
  },
  // New delivery address structure
  deliveryAddress: {
    recipientName: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    pincode: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' }
  },
  // Legacy fields for backward compatibility
  recipientName: {
    type: String,
    required: false
  },
  mobile: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: false
  },
  pincode: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['placed', 'pending', 'confirmed', 'failed', 'success', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'], // Modern e-commerce statuses
    default: 'placed'
  },
  // Payment information
  paymentMethod: {
    type: String,
    default: 'Online Payment'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  paymentId: {
    type: String,
    default: null
  },
  // Timeline of status changes (history)
  orderTimeline: [
    {
      status: {
        type: String,
        enum: ['placed', 'pending', 'confirmed', 'paid', 'failed', 'success', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      description: {
        type: String,
        required: true
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  deliveryMan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  razorpayPaymentId: String,
  razorpayOrderId: String,
  deliveryCharge: {
    type: Number,
    default: 50
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

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema); 