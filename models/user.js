import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firebaseUid: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  // Password field for traditional email/password authentication (optional for Firebase users)
  password: { type: String, select: false }, // select: false prevents password from being returned by default
  isVerified: { type: Boolean, default: false },
  // Password reset token fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

export const UserModel = mongoose.model('User', userSchema);
