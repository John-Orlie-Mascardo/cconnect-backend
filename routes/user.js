import express from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';

const router = express.Router();

/**
 * 🔹 Register user with email/password (Traditional Registration)
 * POST /api/user/register-traditional
 * Body: { email, password }
 * This endpoint is for testing password reset functionality
 */
router.post('/register-traditional', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Determine role based on email
    const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';

    // Create user with a dummy Firebase UID for traditional users
    const firebaseUid = `traditional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save new user to MongoDB
    const newUser = new UserModel({
      email,
      firebaseUid,
      password: hashedPassword,
      role,
      isVerified: false
    });
    const savedUser = await newUser.save();

    console.log('✅ Traditional user registered:', email, 'Role:', role);
    res.status(201).json({
      message: 'User registered successfully',
      userId: savedUser._id,
      email: savedUser.email,
      role: savedUser.role
    });
  } catch (error) {
    console.error('❌ Traditional registration error:', error.message);
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ error: `${field} already registered` });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔹 Login with email/password (Traditional Login)
 * POST /api/user/login-traditional
 * Body: { email, password }
 * Checks password against MongoDB hash (for users who reset password)
 */
router.post('/login-traditional', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user and select password field (it's hidden by default)
    const user = await UserModel.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has a password set
    if (!user.password) {
      return res.status(400).json({
        error: 'This account uses Google Sign-In. Please sign in with Google.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Traditional login successful:', email);

    // Return same structure as Firebase login for frontend compatibility
    res.status(200).json({
      message: 'Login successful',
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
 * This route is called *after* Firebase Auth registration in Flutter.
 */
router.post('/register', verifyFirebaseToken, async (req, res) => {
  try {
    const { email, uid } = req.user;

    // Validate required fields
    if (!email || !uid) {
      return res.status(400).json({ error: 'Email and Firebase UID are required' });
    }

    // Check if user already exists
    const existing = await UserModel.findOne({ $or: [{ firebaseUid: uid }, { email: email }] });
    if (existing) {
      return res.status(409).json({ error: 'User already registered' });
    }

    // Determine role based on email
    const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';

    // Save new user to MongoDB
    const newUser = new UserModel({
      email,
      firebaseUid: uid,
      role,
    });
    const savedUser = await newUser.save();

    console.log('✅ User registered:', email, 'Role:', role);
    res.status(201).json({ message: 'User registered successfully', userId: savedUser._id, email: savedUser.email, role: savedUser.role });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ error: `${field} already registered` });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔹 Verify login via Firebase ID token
 * (Firebase handles authentication; this just confirms the user exists)
 */
router.post('/login', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email } = req.user;

    // Validate required fields from token
    if (!uid || !email) {
      return res.status(400).json({ error: 'Invalid token: missing uid or email' });
    }

    // Check if user exists
    let user = await UserModel.findOne({ firebaseUid: uid });

    // If user doesn't exist, create them (Auto-Registration for Google Sign-In)
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

    console.log('✅ User logged in:', email, 'Role:', user.role);
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
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    if (!req.user) return res.status(500).json({ error: 'No user decoded from token' });

    const user = await UserModel.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({
      userId: user._id,
      uid: req.user.uid,
      email: req.user.email,
      role: user.role,
      registered: true
    });
  } catch (error) {
    console.error('❌ /me error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export const userRoutes = router;
