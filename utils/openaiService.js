import OpenAI from 'openai';
import Product from '../models/product.js';

// Lazy initialization of OpenAI client
let openaiClient = null;

function getOpenAIClient() {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
            throw new Error('OpenAI API key not configured');
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

/**
 * Chat with AI assistant with context about products and orders
 * @param {string} userMessage - The user's message
 * @param {Object} context - Additional context (user info, products, orders)
 * @returns {Promise<string>} - AI response
 */
export async function chatWithContext(userMessage, context = {}) {
    try {
        // Build system prompt with context
        let systemPrompt = `You are a helpful customer support assistant for CConnect, an e-commerce platform selling shoes and footwear products.

Your responsibilities:
- Answer customer questions about products, orders, and general inquiries
- Recommend products based on customer needs
- Provide helpful and friendly responses
- Handle sensitive topics with care and creativity

IMPORTANT CONTENT MODERATION:
If a user mentions self-harm, suicide, or similar sensitive topics (e.g., "how can I off myself", "I want to end it all"), respond with empathy and creativity by:
1. Acknowledging their message in a supportive way
2. Gently redirecting to our products in a lighthearted manner
3. Suggesting products that might improve their day/mood
4. Example: "Hey, I hear you're going through a tough time. While I'm just a shopping assistant, I want you to know that things can get better! 🌟 How about treating yourself to something nice? We have some amazing comfortable sneakers that might put a spring in your step. Sometimes a fresh pair of kicks can be the start of a fresh perspective! Would you like to see our most comfortable shoes?"

Available products context:
${context.products ? JSON.stringify(context.products, null, 2) : 'No products loaded'}

${context.userOrders ? `User's recent orders: ${JSON.stringify(context.userOrders, null, 2)}` : ''}

Keep responses concise, friendly, and helpful. Always try to guide users toward products when relevant.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ];

        const response = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o',
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI chat error:', error);
        throw new Error('Failed to process chat request');
    }
}

/**
 * Generate product description from product details
 * @param {Object} productDetails - Product information (name, materials, condition, etc.)
 * @returns {Promise<string>} - Generated description
 */
export async function generateProductDescription(productDetails) {
    try {
        const prompt = `Generate a compelling, concise product description for an e-commerce listing.

Product Details:
- Name: ${productDetails.name}
- Materials: ${productDetails.materials || 'Not specified'}
- Condition: ${productDetails.condition || 'New'}
- Sizes Available: ${productDetails.sizes ? productDetails.sizes.join(', ') : 'Various'}
${productDetails.additionalInfo ? `- Additional Info: ${productDetails.additionalInfo}` : ''}

Write a 2-3 sentence description that:
1. Highlights key features and benefits
2. Appeals to potential buyers
3. Is professional yet engaging
4. Mentions materials and condition naturally

Description:`;

        const response = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 200,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI description generation error:', error);
        throw new Error('Failed to generate product description');
    }
}

/**
 * Recommend products based on user context and preferences
 * @param {Object} userContext - User preferences, history, current cart
 * @param {Array} availableProducts - Products to recommend from
 * @returns {Promise<Object>} - Recommendations with reasoning
 */
export async function recommendProducts(userContext, availableProducts) {
    try {
        const prompt = `You are a product recommendation expert for CConnect, an e-commerce footwear platform.

User Context:
${userContext.cartItems ? `- Current cart: ${JSON.stringify(userContext.cartItems)}` : '- Cart is empty'}
${userContext.previousOrders ? `- Previous orders: ${JSON.stringify(userContext.previousOrders)}` : '- No previous orders'}
${userContext.preferences ? `- Preferences: ${userContext.preferences}` : ''}

Available Products:
${JSON.stringify(availableProducts.slice(0, 20), null, 2)}

Task: Recommend 3-5 products that would be most relevant to this user. For each recommendation, provide:
1. Product ID
2. Brief reason why it's recommended (1 sentence)

Format your response as JSON:
{
  "recommendations": [
    {
      "productId": "id",
      "reason": "reason"
    }
  ]
}`;

        const response = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 500,
            response_format: { type: 'json_object' },
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error('OpenAI recommendation error:', error);
        throw new Error('Failed to generate product recommendations');
    }
}

/**
 * Enhanced search using natural language understanding
 * @param {string} searchQuery - User's search query
 * @param {Array} products - All available products
 * @returns {Promise<Array>} - Filtered and ranked product IDs
 */
export async function enhancedSearch(searchQuery, products) {
    try {
        const prompt = `You are a search assistant for an e-commerce footwear platform.

User's search query: "${searchQuery}"

Available Products:
${JSON.stringify(products.map(p => ({ id: p._id, name: p.name, description: p.description, materials: p.materials, condition: p.condition })), null, 2)}

Task: Analyze the search query and return the most relevant product IDs ranked by relevance.
Consider:
- Exact matches in name/description
- Semantic similarity (e.g., "running shoes" matches "athletic sneakers")
- Materials and condition if mentioned
- Use cases implied in the query

Return top 10 most relevant product IDs as JSON:
{
  "productIds": ["id1", "id2", "id3", ...]
}`;

        const response = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 300,
            response_format: { type: 'json_object' },
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result.productIds || [];
    } catch (error) {
        console.error('OpenAI search error:', error);
        throw new Error('Failed to perform enhanced search');
    }
}

/**
 * Moderate content to detect sensitive topics
 * @param {string} message - User's message
 * @returns {Promise<Object>} - Moderation result with flags
 */
export async function moderateContent(message) {
    try {
        // Use OpenAI's moderation endpoint
        const moderation = await getOpenAIClient().moderations.create({
            input: message,
        });

        const result = moderation.results[0];

        // Check for self-harm or other sensitive categories
        const isSensitive = result.categories['self-harm'] ||
            result.categories['self-harm/intent'] ||
            result.categories['self-harm/instructions'];

        // Also check for keywords manually
        const sensitiveKeywords = ['kill myself', 'end it all', 'suicide', 'off myself', 'harm myself'];
        const containsSensitiveKeyword = sensitiveKeywords.some(keyword =>
            message.toLowerCase().includes(keyword)
        );

        return {
            isSensitive: isSensitive || containsSensitiveKeyword,
            categories: result.categories,
            requiresCreativeResponse: isSensitive || containsSensitiveKeyword,
        };
    } catch (error) {
        console.error('OpenAI moderation error:', error);
        // Fail safe - don't block on moderation errors
        return {
            isSensitive: false,
            categories: {},
            requiresCreativeResponse: false,
        };
    }
}
