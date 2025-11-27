import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Token expires after 1 hour (3600 seconds)
    }
});

export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
