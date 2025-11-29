import express from 'express';
import { WishlistModel } from '../models/wishlist.js';
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
 * 🔹 Get User's Wishlist
 * GET /api/wishlist
 */
router.get('/', verifyAuth, ensureUser, async (req, res) => {
    try {
        let wishlist = await WishlistModel.findOne({ user: req.mongoUser._id })
            .populate('items');

        if (!wishlist) {
            // Create empty wishlist if not exists
            wishlist = new WishlistModel({ user: req.mongoUser._id, items: [] });
            await wishlist.save();
        }

        res.status(200).json({
            count: wishlist.items.length,
            items: wishlist.items
        });

    } catch (error) {
        console.error('❌ Get wishlist error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Add Product to Wishlist
 * POST /api/wishlist/add
 * Body: { productId }
 */
router.post('/add', verifyAuth, ensureUser, async (req, res) => {
    try {
        console.log('🔖 Wishlist add request - Body:', req.body);
        console.log('🔖 Wishlist add request - Body:', req.body);
        const { productId } = req.body;

        if (!productId) {
            console.log('❌ Missing productId');
            return res.status(400).json({ error: 'Product ID is required' });
        }

        console.log('🔍 Looking for product:', productId);
        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            console.log('❌ Product not found:', productId);
            return res.status(404).json({ error: 'Product not found' });
        }
        console.log('✅ Product found:', product.name);

        // Find or create wishlist
        let wishlist = await WishlistModel.findOne({ user: req.mongoUser._id });
        if (!wishlist) {
            console.log('📝 Creating new wishlist for user');
            wishlist = new WishlistModel({ user: req.mongoUser._id, items: [] });
        } else {
            console.log('📋 Existing wishlist found with', wishlist.items.length, 'items');
        }

        // Check if product already in wishlist
        const alreadyExists = wishlist.items.some(item => item.toString() === productId);
        if (alreadyExists) {
            console.log('⚠️ Product already in wishlist');
            return res.status(400).json({ error: 'Product already in wishlist' });
        }

        // Add product to wishlist
        console.log('➕ Adding product to wishlist');
        wishlist.items.push(productId);
        await wishlist.save();

        // Return populated wishlist
        const populatedWishlist = await WishlistModel.findById(wishlist._id).populate('items');

        console.log('✅ Product added to wishlist:', product.name, 'for user:', req.mongoUser.email);

        res.status(200).json({
            message: 'Product added to wishlist',
            count: populatedWishlist.items.length,
            items: populatedWishlist.items
        });

    } catch (error) {
        console.error('❌ Add to wishlist error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Remove Product from Wishlist
 * DELETE /api/wishlist/remove/:productId
 */
router.delete('/remove/:productId', verifyAuth, ensureUser, async (req, res) => {
    try {
        const { productId } = req.params;

        const wishlist = await WishlistModel.findOne({ user: req.mongoUser._id });
        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        // Remove product from wishlist
        const initialLength = wishlist.items.length;
        wishlist.items = wishlist.items.filter(item => item.toString() !== productId);

        if (wishlist.items.length === initialLength) {
            return res.status(404).json({ error: 'Product not found in wishlist' });
        }

        await wishlist.save();

        // Return populated wishlist
        const populatedWishlist = await WishlistModel.findById(wishlist._id).populate('items');

        console.log('✅ Product removed from wishlist for user:', req.mongoUser.email);

        res.status(200).json({
            message: 'Product removed from wishlist',
            count: populatedWishlist.items.length,
            items: populatedWishlist.items
        });

    } catch (error) {
        console.error('❌ Remove from wishlist error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Toggle Product in Wishlist (Convenience Endpoint)
 * POST /api/wishlist/toggle/:productId
 */
router.post('/toggle/:productId', verifyAuth, ensureUser, async (req, res) => {
    try {
        const { productId } = req.params;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Find or create wishlist
        let wishlist = await WishlistModel.findOne({ user: req.mongoUser._id });
        if (!wishlist) {
            wishlist = new WishlistModel({ user: req.mongoUser._id, items: [] });
        }

        // Check if product is in wishlist
        const existingIndex = wishlist.items.findIndex(item => item.toString() === productId);

        if (existingIndex > -1) {
            // Remove from wishlist
            wishlist.items.splice(existingIndex, 1);
            await wishlist.save();

            const populatedWishlist = await WishlistModel.findById(wishlist._id).populate('items');

            console.log('✅ Product removed from wishlist:', product.name);

            return res.status(200).json({
                message: 'Product removed from wishlist',
                inWishlist: false,
                count: populatedWishlist.items.length,
                items: populatedWishlist.items
            });
        } else {
            // Add to wishlist
            wishlist.items.push(productId);
            await wishlist.save();

            const populatedWishlist = await WishlistModel.findById(wishlist._id).populate('items');

            console.log('✅ Product added to wishlist:', product.name);

            return res.status(200).json({
                message: 'Product added to wishlist',
                inWishlist: true,
                count: populatedWishlist.items.length,
                items: populatedWishlist.items
            });
        }

    } catch (error) {
        console.error('❌ Toggle wishlist error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export const wishlistRoutes = router;
