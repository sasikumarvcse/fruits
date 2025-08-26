const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  adminNote: { type: String },
  deductionPercent: { type: Number, default: 0 },
  finalAmount: { type: Number },
  // Bank details for withdrawal
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  bankName: { type: String, required: true },
  accountHolderName: { type: String, required: true },
});

module.exports = mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', withdrawalRequestSchema); 