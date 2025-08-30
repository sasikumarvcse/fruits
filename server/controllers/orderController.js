const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create order with enhanced tracking
const createOrder = async (req, res) => {
  try {
    const { 
      productId, 
      quantity, 
      recipientName, 
      mobile, 
      address, 
      pincode, 
      total,
      paymentMethod,
      paymentStatus,
      paymentId,
      razorpayOrderId,
      razorpayPaymentId
    } = req.body;

    // Validate required fields
    if (!recipientName || !mobile || !address || !pincode) {
      return res.status(400).json({ message: 'All shipping fields are required.' });
    }

    const product = await Item.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < (quantity || 1)) return res.status(400).json({ message: 'Not enough stock' });

    // Create order timeline
    const orderTimeline = [
      {
        status: 'placed',
        timestamp: new Date(),
        description: 'Order placed successfully',
        updatedBy: req.user._id
      }
    ];

    // Add payment timeline if payment is completed
    if (paymentStatus === 'Completed') {
      orderTimeline.push({
        status: 'paid',
        timestamp: new Date(),
        description: `Payment completed via ${paymentMethod || 'Razorpay'}`,
        updatedBy: req.user._id
      });
    }

    // Create the order
    const order = new Order({
      user: req.user._id,
      items: [{ item: productId, quantity: quantity || 1 }],
      total: total || (product.price * (quantity || 1)),
      totalAmount: total || (product.price * (quantity || 1)),
      recipientName,
      mobile,
      address,
      pincode,
      status: paymentStatus === 'Completed' ? 'confirmed' : 'pending',
      paymentMethod: paymentMethod || 'Razorpay',
      paymentStatus: paymentStatus || 'Pending',
      paymentId: paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      orderTimeline
    });
    
    await order.save();
    console.log(`[ORDER CREATED] User: ${req.user._id}, Order ID: ${order._id}, Payment Status: ${paymentStatus}`);

    // Add order to user's orders array
    const user = await User.findById(req.user._id);
    if (user) {
      user.orders.push(order._id);
      await user.save();
      console.log('Order added to user orders array');
    }

    // Reduce product stock
    product.stock -= (quantity || 1);
    product.sales = (product.sales || 0) + (quantity || 1);
    await product.save();

    // Create notification for user
    await Notification.create({
      user: req.user._id,
      message: `Your order #${order._id.toString().slice(-6)} has been placed successfully!`,
      type: 'order',
      icon: 'fa-shopping-cart'
    });

    // Create notification for admin
    await Notification.create({
      user: null, // null for admin notifications
      message: `New order #${order._id.toString().slice(-6)} received from ${recipientName}`,
      type: 'admin',
      targetRole: 'admin',
      icon: 'fa-bell'
    });

    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create order' });
  }
};

// Get user orders with enhanced details
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.item', 'name price image stock')
      .populate('deliveryMan', 'name mobile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (error) {
    console.error('❌ Get user orders error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch orders' });
  }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email mobile')
      .populate('items.item', 'name price image stock')
      .populate('deliveryMan', 'name mobile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (error) {
    console.error('❌ Get all orders error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch orders' });
  }
};

// Update order status with notifications
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, description } = req.body;

    const order = await Order.findById(orderId)
      .populate('user', 'name email mobile')
      .populate('items.item', 'name price image');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Add to timeline
    order.orderTimeline.push({
      status,
      timestamp: new Date(),
      description: description || `Order status updated to ${status}`,
      updatedBy: req.user.id || req.user._id
    });

    order.status = status;
    order.updatedAt = new Date();
    await order.save();

    // Create notification for user
    await Notification.create({
      user: order.user._id,
      message: `Your order #${order._id.toString().slice(-6)} status has been updated to ${status}`,
      type: 'order',
      icon: 'fa-truck'
    });

    // Create notification for admin if status is critical
    if (['shipped', 'delivered', 'cancelled'].includes(status)) {
      await Notification.create({
        user: null,
        message: `Order #${order._id.toString().slice(-6)} status updated to ${status}`,
        type: 'admin',
        targetRole: 'admin',
        icon: 'fa-info-circle'
      });
    }

    res.json({
      success: true,
      order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('❌ Update order status error:', error);
    res.status(500).json({ message: error.message || 'Failed to update order status' });
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('user', 'name email mobile')
      .populate('items.item', 'name price image stock description')
      .populate('deliveryMan', 'name mobile')
      .populate('orderTimeline.updatedBy', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (req.user.role !== 'admin' && order.user._id.toString() !== (req.user.id || req.user._id).toString()) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('❌ Get order details error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch order details' });
  }
};

// Get order statistics (admin)
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('❌ Get order stats error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch order statistics' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderDetails,
  getOrderStats
};
