const Item = require('../models/Item');
const Order = require('../models/Order');

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    // Find a delivered order with this product, not yet reviewed
    const order = await Order.findOne({
      user: userId,
      status: 'delivered',
      'items.item': productId,
      'items.reviewed': false
    });

    if (!order) {
      return res.status(403).json({ message: 'You can only review delivered, unreviewed products.' });
    }

    // Add the review to the item's reviews array
    const item = await Item.findById(productId);
    if (!item) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    const review = {
      user: userId,
      rating,
      comment,
      createdAt: new Date()
    };
    item.reviews.push(review);
    await item.save();

    // Mark the item as reviewed in the order
    await Order.updateOne(
      { _id: order._id, 'items.item': productId },
      { $set: { 'items.$.reviewed': true } }
    );

    res.status(201).json({ message: 'Review submitted!', review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get reviews for a product, with 'verified' property
exports.getReviewsForProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const item = await Item.findById(productId).populate('reviews.user', 'firstName lastName');
    if (!item) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    // Get all delivered orders for this product
    const deliveredOrders = await Order.find({
      status: 'delivered',
      'items.item': productId
    });
    // Build a set of user IDs who have delivered orders for this product
    const verifiedUserIds = new Set();
    deliveredOrders.forEach(order => {
      if (order.user) verifiedUserIds.add(order.user.toString());
    });
    // Map reviews, adding 'verified' if user is in the set
    const reviews = item.reviews.map(r => {
      const rObj = r.toObject ? r.toObject() : r;
      return {
        ...rObj,
        verified: verifiedUserIds.has(r.user?._id?.toString?.() || r.user?.toString?.())
      };
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    // Find the item containing this review
    const item = await Item.findOne({ 'reviews._id': reviewId });
    if (!item) return res.status(404).json({ message: 'Review not found.' });
    const review = item.reviews.id(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    // Only the review author can edit
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only edit your own review.' });
    }
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    review.updatedAt = new Date();
    await item.save();
    res.json({ message: 'Review updated!', review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';
    // Find the item containing this review
    const item = await Item.findOne({ 'reviews._id': reviewId });
    if (!item) return res.status(404).json({ message: 'Review not found.' });
    const review = item.reviews.id(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    // Only the review author or admin can delete
    if (!isAdmin && review.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own review.' });
    }
    review.remove();
    await item.save();
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 