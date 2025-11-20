import admin from '../config/firebase.js';
import { UserModel } from '../models/user.js';

export async function register(body) {
  try {
    //  Verify Firebase ID token (sent from Flutter)
    const decodedToken = await admin.auth().verifyIdToken(body.idToken);
    const { uid, email } = decodedToken;

    //  Check if user already exists
    const existingUser = await UserModel.findOne({ firebaseUid: uid });
    if (existingUser) {
      return { success: false, message: 'User already exists' };
    }

    //  Create new user in MongoDB
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
