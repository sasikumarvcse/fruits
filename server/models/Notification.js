const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // nullable for global/admin/seller
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // order, offer, system, admin, seller
  icon: { type: String, default: '' }, // e.g., 'fa-bell', 'fa-tag', etc.
  targetRole: { type: String, default: 'user' }, // user, admin, seller, all
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema); 