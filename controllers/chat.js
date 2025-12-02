import { ConversationModel } from '../models/Conversation.js';
import { MessageModel } from '../models/Message.js';
import { UserModel } from '../models/user.js';

// Get all conversations (for admin dashboard)
export const getAllConversations = async (req, res) => {
    try {
        const conversations = await ConversationModel.find({ status: 'active' })
            .populate('customerId', 'name email')
            .sort({ lastMessageTime: -1 });

        res.status(200).json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations',
            error: error.message
        });
    }
};

// Get or create a conversation for a specific user
export const getOrCreateConversation = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists - handle both ObjectId and Firebase UID
        let user;
        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
            user = await UserModel.findById(userId);
        } else {
            user = await UserModel.findOne({ firebaseUid: userId });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find existing conversation or create new one
        let conversation = await ConversationModel.findOne({ customerId: user._id });

        if (!conversation) {
            conversation = await ConversationModel.create({
                customerId: user._id,
                status: 'active'
            });
        }

        res.status(200).json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('Error getting/creating conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversation',
            error: error.message
        });
    }
};

// Get message history for a conversation
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        console.log('📥 Getting messages for conversation:', conversationId);

        const skip = (page - 1) * limit;

        // Get messages without populate first
        let messages = await MessageModel.find({ conversationId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(); // Use lean() for better performance

        console.log(`✅ Found ${messages.length} messages`);

        // Try to populate sender info for each message
        for (let message of messages) {
            try {
                // Only populate if senderId is a valid ObjectId
                if (message.senderId && typeof message.senderId === 'object') {
                    const user = await UserModel.findById(message.senderId).select('name email role');
                    if (user) {
                        message.senderId = user;
                    }
                } else if (message.senderId && typeof message.senderId === 'string') {
                    // If it's a Firebase UID string, try to find the user
                    const user = await UserModel.findOne({ firebaseUid: message.senderId }).select('name email role firebaseUid');
                    if (user) {
                        message.senderId = {
                            _id: user._id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            firebaseUid: user.firebaseUid
                        };
                    }
                }
            } catch (err) {
                console.warn('⚠️ Failed to populate sender for message:', message._id, err.message);
            }
        }

        const total = await MessageModel.countDocuments({ conversationId });

        res.status(200).json({
            success: true,
            messages: messages.reverse(), // Reverse to show oldest first
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Error fetching messages:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { role } = req.body; // 'user' or 'admin'

        // Mark all unread messages from the other party as read
        const senderRole = role === 'admin' ? 'user' : 'admin';

        await MessageModel.updateMany(
            {
                conversationId,
                senderRole,
                isRead: false
            },
            { isRead: true }
        );

        // Update unread count in conversation
        const conversation = await ConversationModel.findOne({
            customerId: conversationId.split('_')[1]
        });

        if (conversation) {
            if (role === 'admin') {
                conversation.adminUnreadCount = 0;
            } else {
                conversation.unreadCount = 0;
            }
            await conversation.save();
        }

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read',
            error: error.message
        });
    }
};

// Close a conversation
export const closeConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await ConversationModel.findByIdAndUpdate(
            conversationId,
            { status: 'closed' },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Conversation closed',
            conversation
        });
    } catch (error) {
        console.error('Error closing conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close conversation',
            error: error.message
        });
    }
};
