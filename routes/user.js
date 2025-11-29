import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * 🔹 Register user with email/password (Traditional Registration)
 * POST /api/user/register-traditional
 * Body: { email, password }
 */
router.post('/register-traditional', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already registered' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';
    const firebaseUid = `traditional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newUser = new UserModel({
      email,
      firebaseUid,
      password: hashedPassword,
      role,
      isVerified: false
    });
    const savedUser = await newUser.save();

    console.log('✅ Traditional user registered:', email);
    res.status(201).json({
      message: 'User registered successfully',
      userId: savedUser._id,
      email: savedUser.email
    });
  } catch (error) {
    console.error('❌ Traditional registration error:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User already registered' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔹 Login with email/password (Traditional Login)
 * POST /api/user/login-traditional
 */
router.post('/login-traditional', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await UserModel.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({
        error: 'This account uses Google Sign-In. Please sign in with Google.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET || 'default_secret_key_change_me';
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid
      },
      secret,
      { expiresIn: '7d' }
    );

    console.log('✅ Traditional login successful:', email);

    res.status(200).json({
      message: 'Login successful',
      token,
      userId: user._id,
      email: user.email,
      firebaseUid: user.firebaseUid,
      role: user.role,
    });

  } catch (error) {
    console.error('❌ Traditional login error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔹 Register user to MongoDB after Firebase creates the account.
 */
router.post('/register', verifyAuth, async (req, res) => {
  try {
    const { email, uid } = req.user;

    if (!email || !uid) {
      return res.status(400).json({ error: 'Email and Firebase UID are required' });
    }

    const existing = await UserModel.findOne({ $or: [{ firebaseUid: uid }, { email: email }] });
    if (existing) {
      return res.status(409).json({ error: 'User already registered' });
    }

    const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';

    const newUser = new UserModel({
      email,
      firebaseUid: uid,
      role,
    });
    const savedUser = await newUser.save();

    console.log('✅ User registered:', email);
    res.status(201).json({ message: 'User registered successfully', userId: savedUser._id });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User already registered' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔹 Verify login via Firebase ID token
 */
router.post('/login', verifyAuth, async (req, res) => {
  try {
    const { uid, email } = req.user;

    if (!uid || !email) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    let user = await UserModel.findOne({ firebaseUid: uid });

    if (!user) {
      console.log(' New user detected from Google Sign-In, registering:', email);
      const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';
      user = new UserModel({
        email,
        firebaseUid: uid,
        role,
      });
      await user.save();
    }

    console.log('✅ User logged in:', email);
    res.status(200).json({
      message: 'Login successful',
      userId: user._id,
      email: user.email,
      firebaseUid: user.firebaseUid,
      role: user.role,
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Protected endpoint: returns authenticated user info
router.get('/me', verifyAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(500).json({ error: 'No user decoded from token' });

    // Use firebaseUid or userId depending on what's available
    const query = req.user.uid ? { firebaseUid: req.user.uid } : { _id: req.user.userId };

    const user = await UserModel.findOne(query);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({
      userId: user._id,
      uid: user.firebaseUid,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      registered: true
    });
  } catch (error) {
    console.error('❌ /me error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔹 Get User Cart (Compatibility Route for Frontend)
 * GET /api/user/cart
 * 
 * Returns cart items in the format expected by the frontend.
 */
router.get('/cart', verifyAuth, async (req, res) => {
  try {
    const { uid } = req.user;

    // Import CartModel
    const { CartModel } = await import('../models/cart.js');

    // Find user in MongoDB
    const user = await UserModel.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find cart and populate product details
    let cart = await CartModel.findOne({ user: user._id }).populate('items.product');

    // If no cart exists, return empty cart
    if (!cart) {
      return res.status(200).json({ items: [] });
    }

    // Format items to match frontend expectations
    const formattedItems = cart.items.map(item => {
      const product = item.product;
      return {
        title: product.name,
        price: `₱${product.price.toFixed(2)}`, // Format as currency string
        image: product.image || '/uploads/default.jpg',
        size: item.size || null, // Size if stored per cart item
        qty: item.quantity,
        productId: product._id.toString()
      };
    });

    console.log('✅ Cart retrieved via /api/user/cart:', formattedItems.length, 'items');
    res.status(200).json({ items: formattedItems });

  } catch (error) {
    console.error('❌ Get cart error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔹 Add to Cart (Compatibility Route for Frontend)
 * POST /api/user/cart
 * Body: { productId, quantity }
 * 
 * This route exists for backward compatibility with the frontend.
 * It forwards requests to the cart service logic.
 */
router.post('/cart', verifyAuth, async (req, res) => {
  try {
    const { uid } = req.user;
    const { productId, quantity, size } = req.body; // Added size parameter

    // Import models needed for cart operations
    const { CartModel } = await import('../models/cart.js');
    const Product = (await import('../models/product.js')).default;

    // Find user in MongoDB
    const user = await UserModel.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate quantity
    const qty = parseInt(quantity) || 1;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find or create cart
    let cart = await CartModel.findOne({ user: user._id });
    if (!cart) {
      cart = new CartModel({ user: user._id, items: [] });
    }

    // Check if item with same product AND size already exists
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.size === size
    );

    if (existingItemIndex > -1) {
      // Update quantity for existing item with same size
      cart.items[existingItemIndex].quantity += qty;
      cart.items[existingItemIndex].price = product.price;
    } else {
      // Add new item with size
      cart.items.push({
        product: productId,
        quantity: qty,
        price: product.price,
        size: size ? parseInt(size) : null // Store size if provided
      });
    }

    await cart.save();

    // Return populated cart
    const populatedCart = await CartModel.findById(cart._id).populate('items.product');

    console.log('✅ Item added to cart via /api/user/cart:', product.name);
    res.status(200).json({
      message: 'Item added to cart successfully',
      cart: populatedCart
    });

  } catch (error) {
    console.error('❌ Add to cart error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔹 Get User Profile
 * GET /api/user/profile
 */
router.get('/profile', verifyAuth, async (req, res) => {
  try {
    // Use firebaseUid or userId depending on what's available
    const query = req.user.uid ? { firebaseUid: req.user.uid } : { _id: req.user.userId };

    const user = await UserModel.findOne(query);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Profile fetched for:', user.email);
    res.status(200).json({
      userId: user._id,
      email: user.email,
      name: user.name || '',
      phone: user.phone || '',
      role: user.role
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔹 Update User Profile
 * PUT /api/user/profile
 * Body: { name?: string, phone?: string }
 */
router.put('/profile', verifyAuth, async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Use firebaseUid or userId depending on what's available
    const query = req.user.uid ? { firebaseUid: req.user.uid } : { _id: req.user.userId };

    const user = await UserModel.findOne(query);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (phone !== undefined) {
      // Basic phone validation (optional)
      if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
      user.phone = phone;
    }

    await user.save();

    console.log('✅ Profile updated for:', user.email);
    res.status(200).json({
      message: 'Profile updated successfully',
      userId: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone
    });

  } catch (error) {
    console.error('❌ Profile update error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export const userRoutes = router;
