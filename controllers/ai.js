import {
    chatWithContext,
    generateProductDescription,
    recommendProducts,
    enhancedSearch,
    moderateContent,
} from '../utils/openaiService.js';
import Product from '../models/product.js';
import { OrderModel } from '../models/order.js';

/**
 * AI Chat endpoint - Customer support chatbot
 * POST /api/ai/chat
 * Body: { message: string, userId?: string }
 */
export async function handleChat(req, res) {
    try {
        const { message, userId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
            return res.status(503).json({
                error: 'AI service not configured. Please add your OpenAI API key to the .env file.'
            });
        }

        // Moderate content first
        const moderation = await moderateContent(message);

        // Build context for the AI
        const context = {};

        // Get some products for context
        const products = await Product.find().limit(10).lean();
        context.products = products;

        // If user is logged in, get their order history
        if (userId) {
            const userOrders = await OrderModel.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('items.product')
                .lean();
            context.userOrders = userOrders;
        }

        // Get AI response
        const aiResponse = await chatWithContext(message, context);

        res.json({
            response: aiResponse,
            moderation: {
                requiresCreativeResponse: moderation.requiresCreativeResponse,
            },
        });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({
            error: 'Failed to process chat request',
            details: error.message
        });
    }
}

/**
 * Product Recommendations endpoint
 * POST /api/ai/recommend
 * Body: { userId?: string, preferences?: string, limit?: number }
 */
export async function handleRecommendations(req, res) {
    try {
        const { userId, preferences, limit = 5 } = req.body;

        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
            return res.status(503).json({
                error: 'AI service not configured. Please add your OpenAI API key to the .env file.'
            });
        }

        // Build user context
        const userContext = { preferences };

        // Get user's cart and order history if logged in
        if (userId) {
            const userOrders = await OrderModel.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate('items.product')
                .lean();

            userContext.previousOrders = userOrders.map(order => ({
                items: order.items.map(item => item.product?.name),
                totalAmount: order.totalAmount,
            }));
        }

        // Get available products
        const availableProducts = await Product.find().lean();

        // Get AI recommendations
        const recommendations = await recommendProducts(userContext, availableProducts);

        // Fetch full product details for recommended products
        const recommendedProducts = await Product.find({
            _id: { $in: recommendations.recommendations.map(r => r.productId) }
        }).limit(limit);

        // Merge with reasons
        const productsWithReasons = recommendedProducts.map(product => {
            const rec = recommendations.recommendations.find(
                r => r.productId.toString() === product._id.toString()
            );
            return {
                ...product.toObject(),
                recommendationReason: rec?.reason || 'Recommended for you',
            };
        });

        res.json({
            recommendations: productsWithReasons,
        });
    } catch (error) {
        console.error('AI recommendation error:', error);
        res.status(500).json({
            error: 'Failed to generate recommendations',
            details: error.message
        });
    }
}

/**
 * Generate Product Description endpoint
 * POST /api/ai/generate-description
 * Body: { name: string, materials?: string, condition?: string, sizes?: array, additionalInfo?: string }
 */
export async function handleGenerateDescription(req, res) {
    try {
        const { name, materials, condition, sizes, additionalInfo } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Product name is required' });
        }

        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
            return res.status(503).json({
                error: 'AI service not configured. Please add your OpenAI API key to the .env file.'
            });
        }

        const productDetails = {
            name,
            materials,
            condition,
            sizes,
            additionalInfo,
        };

        const description = await generateProductDescription(productDetails);

        res.json({
            description,
            productDetails,
        });
    } catch (error) {
        console.error('AI description generation error:', error);
        res.status(500).json({
            error: 'Failed to generate description',
            details: error.message
        });
    }
}

/**
 * Enhanced Search endpoint
 * POST /api/ai/search
 * Body: { query: string, limit?: number }
 */
export async function handleEnhancedSearch(req, res) {
    try {
        const { query, limit = 10 } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
            return res.status(503).json({
                error: 'AI service not configured. Please add your OpenAI API key to the .env file.'
            });
        }

        // Get all products
        const allProducts = await Product.find().lean();

        // Use AI to find relevant products
        const relevantProductIds = await enhancedSearch(query, allProducts);

        // Fetch the products
        const products = await Product.find({
            _id: { $in: relevantProductIds }
        }).limit(limit);

        // Maintain AI ranking order
        const rankedProducts = relevantProductIds
            .map(id => products.find(p => p._id.toString() === id.toString()))
            .filter(Boolean)
            .slice(0, limit);

        res.json({
            query,
            results: rankedProducts,
            totalResults: rankedProducts.length,
        });
    } catch (error) {
        console.error('AI search error:', error);
        res.status(500).json({
            error: 'Failed to perform search',
            details: error.message
        });
    }
}
