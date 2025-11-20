import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    owner: { type: String, required: true }, // firebaseUid from verifyFirebaseToken
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ContactModel = mongoose.model('Contact', contactSchema);