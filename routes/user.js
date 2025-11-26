import express from 'express';
import { UserModel } from '../models/user.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';

const router = express.Router();

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

    // Save new user to MongoDB
    const newUser = new UserModel({
      email,
      firebaseUid: uid,
    });
    const savedUser = await newUser.save();

    console.log('✅ User registered:', email);
    res.status(201).json({ message: 'User registered successfully', userId: savedUser._id, email: savedUser.email });
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
      user = new UserModel({
        email,
        firebaseUid: uid,
      });
      await user.save();
    }

    console.log('✅ User logged in:', email);
    res.status(200).json({
      message: 'Login successful',
      userId: user._id,
      email: user.email,
      firebaseUid: user.firebaseUid,
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
      registered: true
    });
  } catch (error) {
    console.error('❌ /me error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export const userRoutes = router;
