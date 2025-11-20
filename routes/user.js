import express from 'express';
import { UserModel } from '../models/user.js';
import { verifyFirebaseToken } from '../middleware/Firebaseauth.js';

const router = express.Router();

/**
 * 🔹 Register user to MongoDB after Firebase creates the account.
 * This route is called *after* Firebase Auth registration in Flutter.
 */
router.post('/register', verifyFirebaseToken, async (req, res) => {
  try {
    const { email, uid } = req.user;


    // Check if user already exists
    const existing = await UserModel.findOne({ firebaseUid: uid });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Save new user to MongoDB
    const newUser = new UserModel({
      email,
      firebaseUid: uid,
    });
    await newUser.save();

    res.status(201).json({ message: ' User registered & saved to MongoDB' });
  } catch (error) {
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
    const user = await UserModel.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found in MongoDB' });
    }

    res.json({
      message: '✅ Login successful',
      email,
      uid,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected endpoint for POC: returns decoded token info
router.get('/me', verifyFirebaseToken, (req, res) => {
  if (!req.user) return res.status(500).json({ error: 'No user decoded from token' });
  res.json({ uid: req.user.uid, email: req.user.email, claims: req.user });
});

export const userRoutes = router;
