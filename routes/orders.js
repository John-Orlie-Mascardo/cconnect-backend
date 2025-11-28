import express from 'express';
import { OrderModel } from '../models/order.js';
import Product from '../models/product.js';
import { verifyAuth } from '../middleware/auth.js';
import { UserModel } from '../models/user.js';

const router = express.Router();

// Middleware to ensure user exists in MongoDB
const ensureUser = async (req, res, next) => {
    try {
        const { uid } = req.user;
        const user = await UserModel.findOne({ firebaseUid: uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        req.mongoUser = user;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * 🔹 Create New Order
 * POST /api/orders/create
 * Body: { items: [{productId, quantity, size?, price}], deliveryAddress: {...}, paymentMethod: string }
 */
router.post('/create', verifyAuth, ensureUser, async (req, res) => {
    try {
        const { items, deliveryAddress, paymentMethod } = req.body;

        console.log('📦 Order creation request received');
        console.log('   Items:', items ? items.length : 'undefined');
        console.log('   Payment Method:', paymentMethod);
        console.log('   Delivery Address:', deliveryAddress);

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            console.log('❌ Validation failed: No items in order');
            return res.status(400).json({ error: 'Order must contain at least one item' });
        }

        if (!deliveryAddress || !deliveryAddress.province || !deliveryAddress.city ||
            !deliveryAddress.barangay || !deliveryAddress.postalCode || !deliveryAddress.streetDetails) {
            console.log('❌ Validation failed: Incomplete delivery address');
            console.log('   Received address:', JSON.stringify(deliveryAddress, null, 2));
            return res.status(400).json({ error: 'Complete delivery address is required (province, city, barangay, postalCode, streetDetails)' });
        }

        if (!paymentMethod || !['CoD', 'CoP', 'Meetup', 'E-Wallet'].includes(paymentMethod)) {
            console.log('❌ Validation failed: Invalid payment method:', paymentMethod);
            return res.status(400).json({ error: 'Valid payment method is required (CoD, CoP, Meetup, E-Wallet)' });
        }

        // Validate products and calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ error: `Product not found: ${item.productId}` });
            }

            // Check stock availability
            const availableStock = product.quantity || product.stock || 0;
            if (availableStock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
                });
            }

            orderItems.push({
                product: item.productId,
                quantity: item.quantity,
                size: item.size || null,
                price: item.price || product.price
            });

            totalAmount += (item.price || product.price) * item.quantity;

            // Update product stock
            product.quantity = availableStock - item.quantity;
            product.stock = product.quantity; // Keep both fields in sync
            await product.save();
        }

        // Generate order number
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderNumber = `ORD-${timestamp}-${random}`;

        // Create order
        const newOrder = new OrderModel({
            orderNumber,
            user: req.mongoUser._id,
            items: orderItems,
            deliveryAddress,
            paymentMethod,
            totalAmount,
            paymentStatus: paymentMethod === 'CoD' ? 'pending' : 'pending',
            orderStatus: 'pending'
        });

        await newOrder.save();

        // Populate product details for response
        const populatedOrder = await OrderModel.findById(newOrder._id).populate('items.product');

        console.log('✅ Order created:', newOrder.orderNumber, 'for user:', req.mongoUser.email);

        res.status(201).json({
            message: 'Order created successfully',
            orderId: newOrder._id,
            orderNumber: newOrder.orderNumber,
            totalAmount: newOrder.totalAmount,
            paymentMethod: newOrder.paymentMethod,
            orderStatus: newOrder.orderStatus,
            order: populatedOrder
        });

    } catch (error) {
        console.error('❌ Order creation error:', error.message);
        import('fs').then(fs => {
            fs.writeFileSync('error.log', `Order Error: ${error.message}\nStack: ${error.stack}\n`);
        });
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Get User's Orders
 * GET /api/orders
 */
router.get('/', verifyAuth, ensureUser, async (req, res) => {
    try {
        const orders = await OrderModel.find({ user: req.mongoUser._id })
            .populate('items.product')
            .sort({ createdAt: -1 }); // Most recent first

        res.status(200).json({
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error('❌ Get orders error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Get Specific Order Details
 * GET /api/orders/:orderId
 */
router.get('/:orderId', verifyAuth, ensureUser, async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await OrderModel.findById(orderId)
            .populate('items.product')
            .populate('user', 'name email phone');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Verify order belongs to user (unless admin)
        if (order.user.toString() !== req.mongoUser._id.toString() && req.mongoUser.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.status(200).json(order);

    } catch (error) {
        console.error('❌ Get order error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Get All Orders (Admin Only)
 * GET /api/orders/all/list
 */
router.get('/all/list', verifyAuth, ensureUser, async (req, res) => {
    try {
        // Check if user is admin
        if (req.mongoUser.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const orders = await OrderModel.find()
            .populate('items.product')
            .populate('user', 'email name phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error('❌ Get all orders error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Update Order Status (Admin Only)
 * PUT /api/orders/:orderId/status
 * Body: { orderStatus: string, paymentStatus?: string }
 */
router.put('/:orderId/status', verifyAuth, ensureUser, async (req, res) => {
    try {
        // Check if user is admin
        if (req.mongoUser.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { orderId } = req.params;
        const { orderStatus, paymentStatus } = req.body;

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update statuses if provided
        if (orderStatus) {
            const validOrderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
            if (!validOrderStatuses.includes(orderStatus)) {
                return res.status(400).json({ error: 'Invalid order status' });
            }
            order.orderStatus = orderStatus;
        }

        if (paymentStatus) {
            const validPaymentStatuses = ['pending', 'paid', 'failed'];
            if (!validPaymentStatuses.includes(paymentStatus)) {
                return res.status(400).json({ error: 'Invalid payment status' });
            }
            order.paymentStatus = paymentStatus;
        }

        await order.save();

        console.log('✅ Order status updated:', order.orderNumber);

        res.status(200).json({
            message: 'Order status updated successfully',
            order
        });

    } catch (error) {
        console.error('❌ Update order status error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export const orderRoutes = router;
