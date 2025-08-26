const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const PDFDocument = require('pdfkit');

// Create order after Razorpay payment verification
exports.createOrderFromRazorpay = async (orderDetails, razorpayPaymentId, razorpayOrderId) => {
  try {
    console.log('createOrderFromRazorpay called with:', { orderDetails, razorpayPaymentId, razorpayOrderId });
    // orderDetails: { items, address, recipientName, mobile, pincode, ... }
    const { items, address, recipientName, mobile, pincode } = orderDetails;
    // Always resolve userId from orderDetails
    const userId = orderDetails.user || orderDetails.userId || orderDetails._id;
    console.log('Resolved userId for order:', userId);
    if (!userId) throw new Error('User ID is missing in createOrderFromRazorpay');
    // Calculate total (fetch product prices for security)
    let total = 0;
    for (const entry of items) {
      const product = await Item.findById(entry.item);
      if (!product) throw new Error('Product not found: ' + entry.item);
      total += product.price * entry.quantity;
    }
    const now = new Date();
    // Safety: Prevent future dates due to system clock issues
    const safeCreatedAt = now > new Date() ? new Date() : now;
    
    // Create order timeline with allowed status values
    const orderTimeline = [
      {
        status: 'placed',
        timestamp: safeCreatedAt,
        description: 'Order placed successfully'
      },
      {
        status: 'success',
        timestamp: safeCreatedAt,
        description: 'Payment completed via Razorpay'
      }
    ];
    
    const order = new Order({
      user: userId,
      items,
      total,
      recipientName,
      mobile,
      address,
      pincode,
      status: 'success', // Use only allowed values
      razorpayPaymentId,
      razorpayOrderId,
      orderTimeline,
      createdAt: safeCreatedAt
    });
    await order.save();
    console.log('Order saved:', order._id);
    
    // Add order to user's orders array
    const user = await User.findById(userId);
    if (user) {
      user.orders.push(order._id);
      await user.save();
      console.log('Order added to user orders array');
    }
    
    // Create notification for user
    await Notification.create({
      user: userId,
      message: `Your order #${order._id.toString().slice(-6)} has been placed successfully!`,
      type: 'order'
    });
    
    // Notify each seller for the items in the order
    for (const item of items) {
      const product = await Item.findById(item.item);
      if (product) {
        // Decrement stock and increment sales
        product.stock = Math.max(0, (product.stock || 0) - item.quantity);
        product.sales = (product.sales || 0) + item.quantity;
        await product.save();
      }
      if (product && product.seller) {
        await Notification.create({
          user: product.seller,
          message: `You have a new order for "${product.name}" (Order #${order._id.toString().slice(-6)})`,
          type: 'order'
        });
      }
    }
    
    return order;
  } catch (err) {
    console.error('Error in createOrderFromRazorpay:', err);
    throw err;
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    console.log('downloadInvoice called for order:', req.params.orderId);
    const order = await Order.findById(req.params.orderId).populate('items.item');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);
    const doc = new PDFDocument();
    doc.pipe(res);

    // GrowwPark Logo and Name
    try {
      doc.image('client/uploads/logoindex.png', doc.page.width / 2 - 30, 20, { width: 60 });
    } catch (e) { /* ignore if logo not found */ }
    doc.moveDown(2);
    doc.fontSize(22).fillColor('#2d3748').text('GrowwPark', { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(20).fillColor('black').text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('black');
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Recipient: ${order.recipientName}`);
    doc.text(`Mobile: ${order.mobile}`);
    doc.text(`Address: ${order.address}, ${order.pincode}`);
    doc.moveDown();
    // Payment Info
    doc.text(`Payment Method: Razorpay`, { continued: true });
    doc.text(`   Payment Status: ${order.status === 'success' || order.status === 'delivered' ? 'Paid' : order.status}`);
    if (order.razorpayPaymentId) doc.text(`Razorpay Payment ID: ${order.razorpayPaymentId}`);
    doc.moveDown();
    doc.text('Items:', { underline: true });
    order.items.forEach(i => {
      doc.text(`${i.quantity} x ${i.item?.name || ''} @ ₹${i.item?.price || 0} = ₹${(i.item?.price || 0) * i.quantity}`);
    });
    doc.moveDown();
    doc.fontSize(14).fillColor('#2563eb').text(`Total: ₹${order.total}`, { align: 'right' });
    doc.end();
  } catch (err) {
    console.error('Error in downloadInvoice:', err);
    res.status(500).json({ message: err.message });
  }
}; 