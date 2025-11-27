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
      registered: true
    });
  } catch (error) {
    console.error('❌ /me error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export const userRoutes = router;
