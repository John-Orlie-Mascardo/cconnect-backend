import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String (Firebase UID)
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    unreadCount: {
        type: Number,
        default: 0
    },
    adminUnreadCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    }
}, {
    timestamps: true
});

export const ConversationModel = mongoose.model('Conversation', conversationSchema);
