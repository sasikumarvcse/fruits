const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');

exports.createReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemId, reason, comments } = req.body;
    const userId = req.user._id;
    // Check if order belongs to user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    // Check if item is in order
    const itemInOrder = order.items.find(i => i.item.toString() === itemId);
    if (!itemInOrder) return res.status(400).json({ message: 'Item not in order.' });
    // Prevent duplicate requests
    const existing = await ReturnRequest.findOne({ orderId, itemId, userId, status: { $in: ['pending', 'approved'] } });
    if (existing) return res.status(400).json({ message: 'Return/refund request already exists for this item.' });
    const reqDoc = new ReturnRequest({ orderId, itemId, userId, reason, comments });
    await reqDoc.save();
    res.status(201).json(reqDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReturnRequestsForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';
    const filter = { orderId };
    if (!isAdmin) filter.userId = userId;
    const requests = await ReturnRequest.find(filter).populate('itemId', 'name').populate('userId', 'firstName lastName');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllReturnRequests = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const requests = await ReturnRequest.find().populate('orderId', '_id').populate('itemId', 'name').populate('userId', 'firstName lastName');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateReturnRequest = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.params;
    const { status, adminResponse } = req.body;
    const reqDoc = await ReturnRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: 'Return request not found.' });

    // Only update stock if status is being set to 'refunded' and was not already 'refunded'
    if (status && status === 'refunded' && reqDoc.status !== 'refunded') {
      const Product = require('../models/Product');
      const Order = require('../models/Order');
      const order = await Order.findById(reqDoc.orderId);
      if (order) {
        const item = order.items.find(i => i.item.toString() === reqDoc.itemId.toString());
        if (item) {
          const product = await Product.findById(reqDoc.itemId);
          if (product) {
            product.stock += item.quantity;
            product.returns = (product.returns || 0) + item.quantity;
            await product.save();
          }
        }
      }
    }

    if (status) reqDoc.status = status;
    if (adminResponse) reqDoc.adminResponse = adminResponse;
    await reqDoc.save();
    res.json(reqDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 