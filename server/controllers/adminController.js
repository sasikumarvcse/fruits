const User = require('../models/User');
const Item = require('../models/Item');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');

// Dashboard statistics with fixed revenue calculation
exports.getDashboardStats = async (req, res) => {
    try {
        console.log('[ADMIN DASHBOARD] Getting statistics...');
        
        // Get basic counts
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalProducts = await Item.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        // Fixed revenue calculation - include all completed orders
        const revenueStats = await Order.aggregate([
            {
                $match: {
                    $or: [
                        { status: 'delivered' },
                        { status: 'confirmed' },
                        { paymentStatus: 'Completed' }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        // Get recent orders for dashboard
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'firstName lastName email')
            .populate('items.item', 'name price image');

        // Get order status breakdown
        const orderStatusBreakdown = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get monthly revenue for the current year
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(currentYear, 0, 1) },
                    $or: [
                        { status: 'delivered' },
                        { status: 'confirmed' },
                        { paymentStatus: 'Completed' }
                    ]
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    revenue: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const stats = {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: revenueStats[0]?.totalRevenue || 0,
            completedOrders: revenueStats[0]?.orderCount || 0,
            recentOrders,
            orderStatusBreakdown,
            monthlyRevenue,
            currentYear
        };

        console.log('[ADMIN DASHBOARD] Stats calculated:', stats);
        res.json(stats);
    } catch (error) {
        console.error('[ADMIN DASHBOARD] Error:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
    }
};

// Enhanced revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const now = new Date();
        
        let startDate, endDate;
        
        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = now;
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
        }

        // Get revenue for the specified period
        const periodRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lt: endDate },
                    $or: [
                        { status: 'delivered' },
                        { status: 'confirmed' },
                        { paymentStatus: 'Completed' }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        // Get daily revenue for the period (if period is month or less)
        let dailyRevenue = [];
        if (period === 'month' || period === 'week') {
            dailyRevenue = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lt: endDate },
                        $or: [
                            { status: 'delivered' },
                            { status: 'confirmed' },
                            { paymentStatus: 'Completed' }
                        ]
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        revenue: { $sum: '$total' },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);
        }

        // Get top selling products
        const topProducts = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lt: endDate },
                    $or: [
                        { status: 'delivered' },
                        { status: 'confirmed' },
                        { paymentStatus: 'Completed' }
                    ]
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.item',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'items',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' }
        ]);

        const analytics = {
            period,
            startDate,
            endDate,
            totalRevenue: periodRevenue[0]?.totalRevenue || 0,
            orderCount: periodRevenue[0]?.orderCount || 0,
            dailyRevenue,
            topProducts
        };

        res.json(analytics);
    } catch (error) {
        console.error('[REVENUE ANALYTICS] Error:', error);
        res.status(500).json({ message: 'Error fetching revenue analytics', error: error.message });
    }
};

// Product management with status updates
exports.updateProductStatus = async (req, res) => {
    try {
        const { productId } = req.params;
        const { status, isActive, isBestSeller, isOrganic } = req.body;

        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isBestSeller !== undefined) updateData.isBestSeller = isBestSeller;
        if (isOrganic !== undefined) updateData.isOrganic = isOrganic;

        const updatedProduct = await Item.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        console.log(`[ADMIN] Product ${productId} status updated:`, updateData);
        res.json({
            message: 'Product status updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('[ADMIN] Error updating product status:', error);
        res.status(500).json({ message: 'Error updating product status', error: error.message });
    }
};

// Bulk product status update
exports.bulkUpdateProductStatus = async (req, res) => {
    try {
        const { productIds, updates } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: 'Product IDs array is required' });
        }

        const updateData = {};
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
        if (updates.isBestSeller !== undefined) updateData.isBestSeller = updates.isBestSeller;
        if (updates.isOrganic !== undefined) updateData.isOrganic = updates.isOrganic;

        const result = await Item.updateMany(
            { _id: { $in: productIds } },
            updateData
        );

        console.log(`[ADMIN] Bulk updated ${result.modifiedCount} products:`, updateData);
        res.json({
            message: `Successfully updated ${result.modifiedCount} products`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('[ADMIN] Error bulk updating products:', error);
        res.status(500).json({ message: 'Error bulk updating products', error: error.message });
    }
};

// Get products with enhanced filtering and status management
exports.getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (category) query.category = category;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count
        const total = await Item.countDocuments(query);

        // Get products with pagination
        const products = await Item.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('seller', 'firstName lastName email');

        // Get status counts for filtering
        const statusCounts = await Item.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const categoryCounts = await Item.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.json({
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalProducts: total,
                productsPerPage: parseInt(limit)
            },
            filters: {
                statusCounts,
                categoryCounts
            }
        });
    } catch (error) {
        console.error('[ADMIN] Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

// Enhanced order management
exports.getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', search = '' } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { 'user.firstName': { $regex: search, $options: 'i' } },
                { 'user.lastName': { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } },
                { recipientName: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('user', 'firstName lastName email')
            .populate('items.item', 'name price image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get order status breakdown
        const statusBreakdown = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalOrders: total,
                ordersPerPage: parseInt(limit)
            },
            statusBreakdown
        });
    } catch (error) {
        console.error('[ADMIN] Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update order status
        order.status = status;
        if (notes) {
            order.notes = order.notes || [];
            order.notes.push({
                note: notes,
                timestamp: new Date(),
                updatedBy: req.user.id
            });
        }

        // Add to timeline
        order.orderTimeline = order.orderTimeline || [];
        order.orderTimeline.push({
            status: status,
            timestamp: new Date(),
            description: `Status updated to ${status}`,
            updatedBy: req.user.id
        });

        await order.save();

        // Create notification for user
        const Notification = require('../models/Notification');
        await Notification.create({
            user: order.user,
            message: `Your order #${order._id.toString().slice(-6)} status has been updated to ${status}`,
            type: 'order',
            icon: 'fa-shipping-fast'
        });

        console.log(`[ADMIN] Order ${orderId} status updated to ${status}`);
        res.json({
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        console.error('[ADMIN] Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
};

// User management
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        const skip = (page - 1) * limit;

        const query = { role: 'user' };
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                usersPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('[ADMIN] Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`[ADMIN] User ${userId} status updated to ${status}`);
        res.json({
            message: 'User status updated successfully',
            user
        });
    } catch (error) {
        console.error('[ADMIN] Error updating user status:', error);
        res.status(500).json({ message: 'Error updating user status', error: error.message });
    }
};

module.exports = exports;