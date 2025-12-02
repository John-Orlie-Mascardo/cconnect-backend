import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firebaseUid: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'banned'], default: 'active' },
  // Profile fields
  name: { type: String },
  phone: { type: String },
  // Password field for traditional email/password authentication (optional for Firebase users)
  password: { type: String, select: false }, // select: false prevents password from being returned by default
  isVerified: { type: Boolean, default: false },
  // Password reset token fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // Addresses (Philippine format)
  addresses: [{
    province: String,
    city: String,
    barangay: String,
    postalCode: String,
    streetDetails: String,
    isDefault: { type: Boolean, default: false }
  }]
});

export const UserModel = mongoose.model('User', userSchema);
