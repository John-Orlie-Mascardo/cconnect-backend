import express from 'express';
import { CartModel } from '../models/cart.js';

import Product from '../models/product.js';
import { verifyAuth } from '../middleware/auth.js';
import { UserModel } from '../models/user.js';

const router = express.Router();

// Log all cart requests
router.use((req, res, next) => {
    console.log(`\n🛒 CART REQUEST: ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Helper function to sanitize cart data (replace null with empty strings/defaults)
const sanitizeCartData = (cart) => {
    if (!cart) return null;

    const sanitized = cart.toObject();

    // Sanitize each item in the cart
    sanitized.items = sanitized.items.map(item => {
        if (item.product) {
            // Replace null string fields with empty strings
            item.product.description = item.product.description || '';
            item.product.materials = item.product.materials || '';
            item.product.condition = item.product.condition || '';
            item.product.image = item.product.image || '';
            item.product.productId = item.product.productId || '';
            item.product.sizes = item.product.sizes || [];
        }
        // Handle optional size field in cart item
        item.size = item.size || null;
        return item;
    });

    return sanitized;
};

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
 * 🔹 Get User Cart
 * GET /api/cart
 */
router.get('/', verifyAuth, ensureUser, async (req, res) => {
    try {
        let cart = await CartModel.findOne({ user: req.mongoUser._id }).populate('items.product');

        if (!cart) {
            // Create empty cart if not exists
            cart = new CartModel({ user: req.mongoUser._id, items: [] });
            await cart.save();
        }

        res.status(200).json(sanitizeCartData(cart));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Add Item to Cart
 * POST /api/cart/add
 * Body: { productId, quantity }
 */
router.post('/add', verifyAuth, ensureUser, async (req, res) => {
    try {
        console.log('🛒 Add to cart request - Body:', req.body);
        const { productId, quantity } = req.body;
        const qty = parseInt(quantity) || 1;

        console.log('🔍 Looking for product:', productId);
        // Validate product
        const product = await Product.findById(productId);
        if (!product) {
            console.log('❌ Product not found:', productId);
            return res.status(404).json({ error: 'Product not found' });
        }

        // Find or create cart
        let cart = await CartModel.findOne({ user: req.mongoUser._id });
        if (!cart) {
            cart = new CartModel({ user: req.mongoUser._id, items: [] });
        }

        // Check if item exists in cart
        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += qty;
            // Update price in case it changed
            cart.items[existingItemIndex].price = product.price;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                quantity: qty,
                price: product.price
            });
        }

        await cart.save();

        // Return populated cart
        const populatedCart = await CartModel.findById(cart._id).populate('items.product');
        res.status(200).json(sanitizeCartData(populatedCart));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Update Item Quantity
 * PUT /api/cart/update
 * Body: { productId, quantity }
 */
router.put('/update', verifyAuth, ensureUser, async (req, res) => {
    try {
        console.log('🔄 PUT /update called with body:', req.body);
        const { productId, quantity } = req.body;
        const qty = parseInt(quantity);

        if (qty < 1) {
            console.log('❌ Quantity validation failed:', qty);
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        const cart = await CartModel.findOne({ user: req.mongoUser._id });
        if (!cart) {
            console.log('❌ Cart not found for user:', req.mongoUser._id);
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex === -1) {
            console.log('❌ Product not found in cart:', productId);
            console.log('Cart items:', cart.items.map(i => i.product.toString()));
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        cart.items[itemIndex].quantity = qty;
        await cart.save();

        const populatedCart = await CartModel.findById(cart._id).populate('items.product');
        console.log('✅ Cart updated successfully');
        res.status(200).json(sanitizeCartData(populatedCart));

    } catch (error) {
        console.log('❌ Error in PUT /update:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Remove Item from Cart
 * DELETE /api/cart/remove/:productId
 */
router.delete('/remove/:productId', verifyAuth, ensureUser, async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await CartModel.findOne({ user: req.mongoUser._id });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();

        const populatedCart = await CartModel.findById(cart._id).populate('items.product');
        res.status(200).json(sanitizeCartData(populatedCart));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Clear Cart
 * DELETE /api/cart/clear
 */
router.delete('/clear', verifyAuth, ensureUser, async (req, res) => {
    try {
        const cart = await CartModel.findOne({ user: req.mongoUser._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.status(200).json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export const cartRoutes = router;
