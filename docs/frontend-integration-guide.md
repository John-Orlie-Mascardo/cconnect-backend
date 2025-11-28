# Frontend Integration Guide - CConnect Backend Features

## 🎯 Quick Start for Frontend Team

All backend endpoints are **ready and tested**. Here's how to integrate them into your Flutter app.

---

## 📋 Integration Checklist

### ✅ Profile Management (Orlie)
**Backend Ready**: `PUT /api/user/profile`, `GET /api/user/me`

**Flutter Integration:**
1. Update `my_profile_screen.dart` to call backend endpoints
2. Test name and phone updates
3. Verify data persists after logout/login

**Example API Call:**
```dart
// Update profile
final response = await http.put(
  Uri.parse('$baseUrl/user/profile'),
  headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
  body: jsonEncode({'name': 'John Doe', 'phone': '+639123456789'})
);
```

---

### ✅ Wishlist (Ken, Orlie, Josh)
**Backend Ready**: `GET /api/wishlist`, `POST /api/wishlist/add`, `DELETE /api/wishlist/:productId`

**Flutter Integration:**
1. Create `WishlistService` class
2. Update `me_screen.dart` to fetch real wishlist data
3. Add wishlist button to `product_detail_screen.dart`
4. Test add/remove/display

**Example API Calls:**
```dart
// Get wishlist
final response = await http.get(
  Uri.parse('$baseUrl/wishlist'),
  headers: {'Authorization': 'Bearer $token'}
);

// Add to wishlist
await http.post(
  Uri.parse('$baseUrl/wishlist/add'),
  headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
  body: jsonEncode({'productId': productId})
);

// Remove from wishlist
await http.delete(
  Uri.parse('$baseUrl/wishlist/$productId'),
  headers: {'Authorization': 'Bearer $token'}
);
```

---

### ✅ Order Management (Ken, Orlie, Josh)
**Backend Ready**: `POST /api/orders/create`, `GET /api/orders`

**Flutter Integration:**
1. Update `checkout_screen.dart` `_placeOrder()` method
2. Pass cart items, delivery address, payment method
3. Handle success → clear cart → navigate home
4. Create order history screen

**Example API Call:**
```dart
// Create order
final orderData = {
  'items': cartItems.map((item) => {
    'productId': item.productId,
    'quantity': item.quantity,
    'size': item.size,
    'price': item.price
  }).toList(),
  'deliveryAddress': {
    'province': address.province,      // e.g., 'Metro Manila'
    'city': address.city,              // e.g., 'Quezon City'
    'barangay': address.barangay,      // e.g., 'Barangay Commonwealth'
    'postalCode': address.postalCode,  // e.g., '1100'
    'streetDetails': address.streetDetails  // e.g., '123 Main St, Bldg A'
  },
  'paymentMethod': selectedPaymentMethod // 'CoD', 'CoP', 'Meetup', 'E-Wallet'
};

final response = await http.post(
  Uri.parse('$baseUrl/orders/create'),
  headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
  body: jsonEncode(orderData)
);

// Response includes: orderNumber, orderId, totalAmount, orderStatus
```

---

### ✅ Address Management (Orlie)
**Backend Ready**: `POST /api/user/addresses`, `GET /api/user/addresses`, `PUT /api/user/addresses/:id`, `DELETE /api/user/addresses/:id`

**Flutter Integration:**
1. Use Philippine address format (province, city, barangay, postalCode, streetDetails)
2. Update `address_form_sheet.dart` with correct fields
3. Update `checkout_screen.dart` address display
4. Test create/edit/delete addresses

**Example API Call:**
```dart
// Create address (PHILIPPINE FORMAT)
final addressData = {
  'province': 'Metro Manila',
  'city': 'Quezon City',
  'barangay': 'Barangay Commonwealth',
  'postalCode': '1100',
  'streetDetails': '123 Main St, Building A, Unit 5',
  'isDefault': true
};

await http.post(
  Uri.parse('$baseUrl/user/addresses'),
  headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
  body: jsonEncode(addressData)
);
```

---

### ✅ Payment Methods (Josh)
**Backend Ready**: Supports CoD, CoP, Meetup, E-Wallet

**Flutter Integration:**
1. Update `cart_screen.dart` payment selection UI
2. Pass selected method to `checkout_screen.dart`
3. Send payment method in order creation

**Payment Methods:**
- `"CoD"` - Cash on Delivery
- `"CoP"` - Cash on Pickup  
- `"Meetup"` - Meetup
- `"E-Wallet"` - E-Wallet (ready for future gateway integration)

---

## 🧪 Testing Steps

### 1. Profile Testing
```
1. Open Profile Settings
2. Update name → Save → Verify in UI
3. Update phone → Save → Verify in UI
4. Logout and login → Verify data persists
```

### 2. Wishlist Testing
```
1. Browse products → Click wishlist icon
2. Go to Me screen → View wishlist
3. Click "Add to Cart" from wishlist
4. Remove item from wishlist
5. Verify backend persistence (refresh app)
```

### 3. Order Flow Testing
```
1. Add products to cart
2. Select payment method in cart screen
3. Go to checkout
4. Select/create delivery address
5. Place order
6. Verify: cart cleared, order created, stock reduced
7. View order in order history
```

### 4. Address Testing
```
1. Create new address (without region field)
2. Edit existing address
3. Set default address
4. Delete address (with confirmation)
5. Use address in checkout
```

---

## 🔧 Backend Configuration

**Base URL**: `http://localhost:3000/api`  
**Authentication**: Bearer token in Authorization header  
**Content-Type**: `application/json`

### Getting Auth Token
```dart
// Login returns token
final loginResponse = await http.post(
  Uri.parse('$baseUrl/user/login-traditional'),
  body: jsonEncode({'email': email, 'password': password}),
  headers: {'Content-Type': 'application/json'}
);
final token = jsonDecode(loginResponse.body)['token'];
```

---

## 📊 API Response Formats

### Wishlist Response
```json
{
  "count": 2,
  "items": [
    {
      "_id": "...",
      "name": "Product Name",
      "price": 1299,
      "image": "/uploads/product.jpg",
      "description": "..."
    }
  ]
}
```

### Order Creation Response
```json
{
  "message": "Order created successfully",
  "orderId": "...",
  "orderNumber": "ORD-ABC123-XYZ",
  "totalAmount": 2598,
  "paymentMethod": "CoD",
  "orderStatus": "pending"
}
```

### Profile Response
```json
{
  "userId": "...",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+639123456789",
  "role": "user"
}
```

---

## 🚨 Important Notes

### Stock Management
- Orders automatically reduce product stock
- Backend validates stock before order creation
- If insufficient stock, order creation fails with error

### Error Handling
```dart
try {
  final response = await http.post(...);
  if (response.statusCode == 200 || response.statusCode == 201) {
    // Success
  } else {
    final error = jsonDecode(response.body)['error'];
    // Show error to user
  }
} catch (e) {
  // Handle network errors
}
```

### Philippine Address Format
- ✅ Use: province, city, barangay, postalCode, streetDetails, isDefault
- ❌ Do NOT use: street, state, zipCode, country, region
- Backend expects Philippine format for all address operations

---

## 🎯 Recommended Implementation Order

1. **Profile Management** (Easiest - 30 min)
   - Update existing profile screen to use backend
   
2. **Address Management** (Quick - 1 hour)
   - Remove region field from forms
   - Test CRUD operations

3. **Wishlist** (Medium - 2-3 hours)
   - Create service class
   - Update Me screen
   - Add product detail integration

4. **Order Creation** (Complex - 3-4 hours)
   - Update checkout flow
   - Test full cart → order conversion
   - Verify stock updates

5. **End-to-End Testing** (1-2 hours)
   - Test complete user flows
   - Verify data persistence
   - Test edge cases

---

## 📞 Need Help?

- **API Documentation**: `docs/api-endpoints.md`
- **Test Scripts**: `quick-test.ps1`, `test-features.ps1`
- **Testing Results**: `docs/testing-results.md`

All backend endpoints are tested and ready. Happy coding! 🚀
