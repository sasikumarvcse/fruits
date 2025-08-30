const Order = require('../models/Order');
const User = require('../models/User');
const Item = require('../models/Item');

// Generate invoice for completed order
exports.generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Get order details
        const order = await Order.findById(orderId)
            .populate('user', 'firstName lastName email mobile')
            .populate('items.item', 'name price image description');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is authorized to view this invoice
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Admin can view any invoice, users can only view their own
        if (decoded.user.role !== 'admin' && decoded.user.id !== order.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this invoice' });
        }

        // Check if order is completed (payment successful)
        if (order.paymentStatus !== 'Completed' && order.status !== 'delivered') {
            return res.status(400).json({ message: 'Invoice can only be generated for completed orders' });
        }

        // Generate invoice data
        const invoice = {
            invoiceNumber: `INV-${order._id.toString().slice(-8).toUpperCase()}`,
            orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
            orderDate: order.createdAt,
            invoiceDate: new Date(),
            customer: {
                name: `${order.user.firstName} ${order.user.lastName}`,
                email: order.user.email,
                mobile: order.user.mobile,
                address: order.address,
                pincode: order.pincode
            },
            items: order.items.map(item => ({
                name: item.item.name,
                description: item.item.description,
                quantity: item.quantity,
                unitPrice: item.price,
                total: item.price * item.quantity
            })),
            subtotal: order.total,
            tax: 0, // Add tax calculation if needed
            shipping: 0, // Add shipping cost if needed
            total: order.total,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.status,
            notes: order.notes || []
        };

        res.json({
            success: true,
            invoice,
            message: 'Invoice generated successfully'
        });

    } catch (error) {
        console.error('[INVOICE] Error generating invoice:', error);
        res.status(500).json({ message: 'Error generating invoice', error: error.message });
    }
};

// Generate PDF invoice (optional - for download)
exports.downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Get order details
        const order = await Order.findById(orderId)
            .populate('user', 'firstName lastName email mobile')
            .populate('items.item', 'name price image description');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check authorization
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.user.role !== 'admin' && decoded.user.id !== order.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to download this invoice' });
        }

        // Check if order is completed
        if (order.paymentStatus !== 'Completed' && order.status !== 'delivered') {
            return res.status(400).json({ message: 'Invoice can only be downloaded for completed orders' });
        }

        // Generate HTML invoice
        const htmlInvoice = generateHTMLInvoice(order);

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${order._id}.html"`);
        
        res.send(htmlInvoice);

    } catch (error) {
        console.error('[INVOICE] Error downloading invoice:', error);
        res.status(500).json({ message: 'Error downloading invoice', error: error.message });
    }
};

// Get all invoices for a user
exports.getUserInvoices = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user.id;

        // Get completed orders for the user
        const orders = await Order.find({
            user: userId,
            $or: [
                { paymentStatus: 'Completed' },
                { status: 'delivered' }
            ]
        })
        .populate('items.item', 'name price image')
        .sort({ createdAt: -1 });

        // Generate invoice summaries
        const invoices = orders.map(order => ({
            invoiceNumber: `INV-${order._id.toString().slice(-8).toUpperCase()}`,
            orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
            orderDate: order.createdAt,
            total: order.total,
            status: order.status,
            paymentStatus: order.paymentStatus,
            items: order.items.length
        }));

        res.json({
            success: true,
            invoices,
            count: invoices.length
        });

    } catch (error) {
        console.error('[INVOICE] Error getting user invoices:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
};

// Get all invoices (admin only)
exports.getAllInvoices = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build query for completed orders
        const query = {
            $or: [
                { paymentStatus: 'Completed' },
                { status: 'delivered' }
            ]
        };

        if (search) {
            query.$or = [
                { 'user.firstName': { $regex: search, $options: 'i' } },
                { 'user.lastName': { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('user', 'firstName lastName email')
            .populate('items.item', 'name price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Generate invoice summaries
        const invoices = orders.map(order => ({
            invoiceNumber: `INV-${order._id.toString().slice(-8).toUpperCase()}`,
            orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
            orderDate: order.createdAt,
            customer: `${order.user.firstName} ${order.user.lastName}`,
            email: order.user.email,
            total: order.total,
            status: order.status,
            paymentStatus: order.paymentStatus,
            items: order.items.length
        }));

        res.json({
            success: true,
            invoices,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalInvoices: total,
                invoicesPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('[INVOICE] Error getting all invoices:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
};

// Helper function to generate HTML invoice
function generateHTMLInvoice(order) {
    const invoiceNumber = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
    const orderNumber = `ORD-${order._id.toString().slice(-8).toUpperCase()}`;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .customer-info { margin-bottom: 30px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .items-table th { background-color: #f5f5f5; }
        .total-section { text-align: right; font-size: 18px; font-weight: bold; }
        .footer { margin-top: 50px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🍎 FreshFruits</h1>
        <h2>INVOICE</h2>
    </div>
    
    <div class="invoice-info">
        <div>
            <strong>Invoice Number:</strong> ${invoiceNumber}<br>
            <strong>Order Number:</strong> ${orderNumber}<br>
            <strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}
        </div>
        <div>
            <strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}<br>
            <strong>Payment Status:</strong> ${order.paymentStatus}<br>
            <strong>Order Status:</strong> ${order.status}
        </div>
    </div>
    
    <div class="customer-info">
        <h3>Customer Information</h3>
        <strong>Name:</strong> ${order.recipientName}<br>
        <strong>Mobile:</strong> ${order.mobile}<br>
        <strong>Address:</strong> ${order.address}<br>
        <strong>Pincode:</strong> ${order.pincode}
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${order.items.map(item => `
                <tr>
                    <td>${item.item.name}</td>
                    <td>${item.item.description || 'N/A'}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="total-section">
        <strong>Total Amount: ₹${order.total.toFixed(2)}</strong>
    </div>
    
    <div class="footer">
        <p>Thank you for your purchase!</p>
        <p>For any queries, please contact our customer support.</p>
    </div>
</body>
</html>`;
}

module.exports = exports;