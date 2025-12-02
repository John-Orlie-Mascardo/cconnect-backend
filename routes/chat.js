import express from 'express';
import {
    getAllConversations,
    getOrCreateConversation,
    getMessages,
    markMessagesAsRead,
    closeConversation
} from '../controllers/chat.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyAuth);

// Get all conversations (admin)
router.get('/conversations', getAllConversations);

// Get or create conversation for a user
router.get('/conversation/:userId', getOrCreateConversation);

// Get message history
router.get('/messages/:conversationId', getMessages);

// Mark messages as read
router.post('/messages/:conversationId/read', markMessagesAsRead);

// Close conversation
router.delete('/conversation/:conversationId', closeConversation);

export const chatRoutes = router;
