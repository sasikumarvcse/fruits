const Order = require('../models/Order');
const Item = require('../models/Item');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ✅ Create order from Razorpay payment
const createOrderFromRazorpay = async (orderDetails, paymentId, razorpayOrderId) => {
    try {
        console.log('🔄 Creating order from Razorpay payment...');
        console.log('Order details:', orderDetails);
        
        const {
            items,
            total,
            recipientName,
            mobile,
            address,
            pincode,
            user: userId
        } = orderDetails;

        // Validate required fields
        if (!items || !items.length) {
            throw new Error('Order items are required');
        }
        
        if (!recipientName || !mobile || !address || !pincode) {
            throw new Error('All shipping details are required');
        }

        // Validate and fetch product details
        const orderItems = [];
        let calculatedTotal = 0;

        for (const item of items) {
            // Try both models for compatibility
            let product = await Item.findById(item.item);
            if (!product) {
                product = await Product.findById(item.item);
            }
            
            if (!product) {
                throw new Error(`Product not found: ${item.item}`);
            }

            // Check stock availability
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
            }

            const itemTotal = product.price * item.quantity;
            calculatedTotal += itemTotal;

            orderItems.push({
                item: product._id,
                quantity: item.quantity,
                reviewed: false
            });

            // Update product stock and sales
            product.stock -= item.quantity;
            product.sales = (product.sales || 0) + item.quantity;
            await product.save();
            
            console.log(`✅ Updated stock for ${product.name}: ${product.stock} remaining`);
        }

        // Verify total amount matches calculated amount
        if (Math.abs(calculatedTotal - parseFloat(total)) > 0.01) {
            throw new Error(`Amount mismatch: expected ${calculatedTotal}, received ${total}`);
        }

        // Create order timeline
        const orderTimeline = [
            {
                status: 'placed',
                timestamp: new Date(),
                description: 'Order placed successfully',
                updatedBy: userId
            },
            {
                status: 'confirmed',
                timestamp: new Date(),
                description: 'Payment completed and order confirmed',
                updatedBy: userId
            }
        ];

        // Create the order
        const order = new Order({
            user: userId,
            items: orderItems,
            total: calculatedTotal,
            recipientName,
            mobile,
            address,
            pincode,
            status: 'confirmed',
            paymentMethod: 'Razorpay',
            paymentStatus: 'Completed',
            paymentId: paymentId,
            razorpayPaymentId: paymentId,
            razorpayOrderId: razorpayOrderId,
            orderTimeline
        });

        await order.save();
        console.log(`✅ Order created successfully: ${order._id}`);

        // Add order to user's orders array
        try {
            const user = await User.findById(userId);
            if (user) {
                user.orders.push(order._id);
                await user.save();
                console.log('✅ Order added to user orders array');
            }
        } catch (userError) {
            console.error('⚠️ Failed to add order to user array:', userError);
            // Don't fail the order creation for this
        }

        // Create notification for user
        try {
            if (Notification) {
                await Notification.create({
                    user: userId,
                    message: `Your order #${order._id.toString().slice(-6)} has been confirmed! Total: ₹${calculatedTotal.toFixed(2)}`,
                    type: 'order'
                });
                console.log('✅ Order confirmation notification created');
            }
        } catch (notificationError) {
            console.error('⚠️ Failed to create notification:', notificationError);
            // Don't fail the order creation for this
        }

        return order;

    } catch (error) {
        console.error('❌ Error creating order from Razorpay:', error);
        throw error;
    }
};

module.exports = {
    createOrderFromRazorpay
};
