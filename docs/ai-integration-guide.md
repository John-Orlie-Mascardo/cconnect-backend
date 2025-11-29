# AI Integration Guide for Flutter Frontend

## Overview

This guide explains how to integrate the OpenAI-powered AI features into your Flutter CConnect application. The backend provides four main AI endpoints:

1. **AI Chatbot** - Customer support and general queries
2. **Product Recommendations** - Personalized product suggestions
3. **Product Description Generator** - Auto-generate descriptions (admin)
4. **Enhanced Search** - Natural language product search

---

## Prerequisites

- Backend server running with OpenAI API key configured
- Flutter HTTP package (e.g., `http` or `dio`)
- User authentication token for protected endpoints

---

## 1. AI Chatbot Integration

### Use Case
Create a chat interface where customers can ask questions about products, orders, shipping, etc.

### Flutter Service Example

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class AIService {
  final String baseUrl = 'http://localhost:3000/api';
  
  Future<Map<String, dynamic>> sendChatMessage(
    String message, {
    String? userId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/ai/chat'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': message,
          if (userId != null) 'userId': userId,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 503) {
        throw Exception('AI service not configured');
      } else {
        throw Exception('Failed to send message');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }
}
```

### UI Example

```dart
class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final AIService _aiService = AIService();
  final TextEditingController _messageController = TextEditingController();
  List<Map<String, String>> _messages = [];
  bool _isLoading = false;

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'content': message});
      _isLoading = true;
    });

    _messageController.clear();

    try {
      final response = await _aiService.sendChatMessage(message);
      
      setState(() {
        _messages.add({
          'role': 'assistant',
          'content': response['response'],
        });
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _messages.add({
          'role': 'error',
          'content': 'Sorry, I encountered an error: $e',
        });
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Customer Support')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg['role'] == 'user';
                
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: EdgeInsets.all(8),
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isUser ? Colors.blue : Colors.grey[300],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      msg['content']!,
                      style: TextStyle(
                        color: isUser ? Colors.white : Colors.black,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_isLoading)
            Padding(
              padding: EdgeInsets.all(8),
              child: CircularProgressIndicator(),
            ),
          Padding(
            padding: EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Ask me anything...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.send),
                  onPressed: _isLoading ? null : _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 2. Product Recommendations

### Use Case
Show personalized product recommendations on home screen or product pages.

### Service Method

```dart
Future<List<dynamic>> getRecommendations({
  String? userId,
  String? preferences,
  int limit = 5,
}) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/ai/recommend'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        if (userId != null) 'userId': userId,
        if (preferences != null) 'preferences': preferences,
        'limit': limit,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['recommendations'];
    } else {
      throw Exception('Failed to get recommendations');
    }
  } catch (e) {
    throw Exception('Error: $e');
  }
}
```

### UI Example

```dart
class RecommendationsWidget extends StatelessWidget {
  final AIService _aiService = AIService();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<dynamic>>(
      future: _aiService.getRecommendations(limit: 5),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return CircularProgressIndicator();
        }
        
        if (snapshot.hasError) {
          return Text('Error loading recommendations');
        }

        final products = snapshot.data ?? [];
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Recommended for You', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            SizedBox(
              height: 250,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: products.length,
                itemBuilder: (context, index) {
                  final product = products[index];
                  return ProductCard(
                    product: product,
                    recommendationReason: product['recommendationReason'],
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}
```

---

## 3. Enhanced Search

### Use Case
Replace or enhance existing search with AI-powered natural language understanding.

### Service Method

```dart
Future<List<dynamic>> enhancedSearch(String query, {int limit = 10}) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/ai/search'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'query': query,
        'limit': limit,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['results'];
    } else {
      throw Exception('Failed to search');
    }
  } catch (e) {
    throw Exception('Error: $e');
  }
}
```

### UI Integration

```dart
// In your search screen
Future<void> _performSearch(String query) async {
  setState(() => _isLoading = true);
  
  try {
    final results = await _aiService.enhancedSearch(query);
    setState(() {
      _searchResults = results;
      _isLoading = false;
    });
  } catch (e) {
    // Fallback to regular search if AI fails
    _performRegularSearch(query);
  }
}
```

---

## 4. Product Description Generator (Admin)

### Use Case
Auto-generate product descriptions when adding new products.

### Service Method

```dart
Future<String> generateDescription({
  required String name,
  String? materials,
  String? condition,
  List<int>? sizes,
  String? additionalInfo,
}) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/ai/generate-description'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        if (materials != null) 'materials': materials,
        if (condition != null) 'condition': condition,
        if (sizes != null) 'sizes': sizes,
        if (additionalInfo != null) 'additionalInfo': additionalInfo,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['description'];
    } else {
      throw Exception('Failed to generate description');
    }
  } catch (e) {
    throw Exception('Error: $e');
  }
}
```

### UI Integration (Admin Product Form)

```dart
// In your add/edit product form
ElevatedButton(
  child: Text('Generate Description with AI'),
  onPressed: () async {
    final description = await _aiService.generateDescription(
      name: _nameController.text,
      materials: _materialsController.text,
      condition: _conditionController.text,
      sizes: _selectedSizes,
    );
    
    setState(() {
      _descriptionController.text = description;
    });
  },
)
```

---

## Error Handling

### Service Not Configured (503)

```dart
try {
  final response = await _aiService.sendChatMessage(message);
  // Handle success
} catch (e) {
  if (e.toString().contains('503') || e.toString().contains('not configured')) {
    // Show user-friendly message
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('AI Feature Unavailable'),
        content: Text('The AI assistant is currently being set up. Please try again later.'),
        actions: [
          TextButton(
            child: Text('OK'),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }
}
```

---

## Best Practices

1. **Caching**: Cache recommendations to reduce API calls
2. **Fallbacks**: Always have a fallback for when AI fails
3. **Loading States**: Show loading indicators during AI processing
4. **Error Messages**: Provide user-friendly error messages
5. **Rate Limiting**: Implement debouncing for search to avoid excessive API calls
6. **Offline Handling**: Gracefully handle offline scenarios

---

## Testing

Before deploying to production:

1. Test with various chat queries (normal and edge cases)
2. Verify sensitive content handling works correctly
3. Test recommendations with different user contexts
4. Validate search results are relevant
5. Check description generation quality

---

## Cost Optimization Tips

1. **Limit context size**: Only send necessary product/order data
2. **Cache results**: Store recent recommendations
3. **Debounce search**: Wait for user to finish typing
4. **Set max tokens**: Keep responses concise
5. **Monitor usage**: Track API calls and costs

---

## Support

If you encounter issues:
- Check backend logs for detailed error messages
- Verify OpenAI API key is correctly set in `.env`
- Ensure you have sufficient OpenAI credits
- Test endpoints using `test-ai.ps1` script
