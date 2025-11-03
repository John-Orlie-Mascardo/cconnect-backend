import admin from '../config/firebase.js';
import { UserModel } from '../models/user.js';

export async function register(body) {
  try {
    // 1️⃣ Verify Firebase ID token (sent from Flutter)
    const decodedToken = await admin.auth().verifyIdToken(body.idToken);
    const { uid, email } = decodedToken;

    // 2️⃣ Check if user already exists
    const existingUser = await UserModel.findOne({ firebaseUid: uid });
    if (existingUser) {
      return { success: false, message: 'User already exists' };
    }

    // 3️⃣ Create new user in MongoDB
    const newUser = new UserModel({
      firebaseUid: uid,
      email: email,
      //role: body.role || 'user', // optional field
    });

    await newUser.save();

    return { success: true, message: 'User registered successfully' };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, message: 'Failed to register user', error };
  }
}
