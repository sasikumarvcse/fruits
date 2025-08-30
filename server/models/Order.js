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
  total: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  deliveryAddress: {
    type: Object,
    required: false
  },
  deliveryCharge: {
    type: Number,
    default: 0
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