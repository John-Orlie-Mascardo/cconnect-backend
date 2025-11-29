import express from 'express';
import {
    handleChat,
    handleRecommendations,
    handleGenerateDescription,
    handleEnhancedSearch,
} from '../controllers/ai.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * AI-powered customer support chatbot
 * Body: { message: string, userId?: string }
 */
router.post('/chat', handleChat);

/**
 * POST /api/ai/recommend
 * Get AI-powered product recommendations
 * Body: { userId?: string, preferences?: string, limit?: number }
 */
router.post('/recommend', handleRecommendations);

/**
 * POST /api/ai/generate-description
 * Generate product description using AI
 * Body: { name: string, materials?: string, condition?: string, sizes?: array, additionalInfo?: string }
 */
router.post('/generate-description', handleGenerateDescription);

/**
 * POST /api/ai/search
 * Enhanced product search with natural language understanding
 * Body: { query: string, limit?: number }
 */
router.post('/search', handleEnhancedSearch);

export { router as aiRoutes };
