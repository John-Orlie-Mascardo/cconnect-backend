import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get ESM-safe directory references
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Firebase Setup ---
let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', err.message);
    }
}

if (!serviceAccount) {
    const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
        try {
            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        } catch (err) {
            console.error('❌ Failed to parse firebase service account JSON:', err.message);
        }
    }
}

if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log('🔥 Firebase Admin initialized');
}

// --- Auth Middleware ---

export async function verifyAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // 1. Try Firebase Verification
    if (admin.apps.length) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.user = decodedToken; // { uid, email, ... }
            req.authType = 'firebase';
            return next();
        } catch (error) {
            // If it's not a valid Firebase token, fall through to check Custom JWT
            // Don't log error yet, as it might be a valid custom token
        }
    }

    // 2. Try Custom JWT Verification (for Traditional Login)
    try {
        const secret = process.env.JWT_SECRET || 'default_secret_key_change_me';
        const decoded = jwt.verify(token, secret);
        req.user = decoded; // { userId, email, role, ... }
        req.authType = 'custom';

        // Map custom token fields to match Firebase structure where possible for compatibility
        if (!req.user.uid) req.user.uid = req.user.firebaseUid || `traditional_${req.user.userId}`;

        return next();
    } catch (error) {
        console.error('❌ Auth verification failed:', error.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}
