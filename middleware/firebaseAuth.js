import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get ESM-safe directory references
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load your Firebase service account JSON safely with fs
const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');

let serviceAccount = null;
if (!fs.existsSync(serviceAccountPath)) {
  console.error('⚠️ Firebase service account not found at', serviceAccountPath);
} else {
  try {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to parse firebase service account JSON:', err.message);
  }
}

// Initialize Firebase Admin if credentials available
if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('🔥 Firebase Admin initialized successfully');
}

// Middleware to verify Firebase ID token
export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // contains email, uid, etc.
    next();
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error?.message || error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
