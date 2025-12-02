import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String (Firebase UID)
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['user', 'admin'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
});

// Index for efficient querying
messageSchema.index({ conversationId: 1, timestamp: -1 });

export const MessageModel = mongoose.model('Message', messageSchema);
