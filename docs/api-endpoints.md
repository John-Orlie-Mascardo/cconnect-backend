# CConnect Backend API Documentation

## New Endpoints

### Profile Management

#### Update User Profile
```
PUT /api/user/profile
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "phone": "+639123456789"
}

Response:
{
  "message": "Profile updated successfully",
  "userId": "...",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+639123456789"
}
```

#### Get User Profile
```
GET /api/user/me
Authorization: Bearer {token}

Response:
{
  "userId": "...",
  "uid": "...",
  "email": "user@example.com",
  "role": "user",
  "name": "John Doe",
  "phone": "+639123456789",
  "registered": true
}
```

---

### Wishlist Management

#### Get User's Wishlist
```
GET /api/wishlist
Authorization: Bearer {token}

Response:
{
  "count": 2,
  "items": [
    {
      "_id": "...",
      "name": "Product Name",
      "price": 1299,
      "image": "/uploads/product.jpg",
      ...
    }
  ]
}
```

#### Add Product to Wishlist
```
POST /api/wishlist/add
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "productId": "product_id_here"
}

Response:
{
  "message": "Product added to wishlist",
  "count": 3,
  "items": [...]
}
```

#### Remove Product from Wishlist
```
DELETE /api/wishlist/:productId
Authorization: Bearer {token}

Response:
{
  "message": "Product removed from wishlist",
  "count": 2,
  "items": [...]
}
```

#### Toggle Product in Wishlist
```
POST /api/wishlist/toggle/:productId
Authorization: Bearer {token}

Response:
{
  "message": "Product added to wishlist" | "Product removed from wishlist",
  "inWishlist": true | false,
  "count": 2,
  "items": [...]
}
```

---

### Order Management

#### Create New Order
```
POST /api/orders/create
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "size": 9,
      "price": 1299
    }
  ],
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Manila",
    "state": "NCR",
    "zipCode": "1000",
    "country": "Philippines"
  },
  "paymentMethod": "CoD" | "CoP" | "Meetup" | "E-Wallet"
}

Response:
{
  "message": "Order created successfully",
  "orderId": "...",
  "orderNumber": "ORD-ABC123-XYZ",
  "totalAmount": 2598,
  "paymentMethod": "CoD",
  "orderStatus": "pending",
  "order": {...}
}
```

#### Get User's Orders
```
GET /api/orders
Authorization: Bearer {token}

Response:
{
  "count": 5,
  "orders": [
    {
      "_id": "...",
      "orderNumber": "ORD-ABC123-XYZ",
      "items": [...],
      "deliveryAddress": {...},
      "paymentMethod": "CoD",
      "paymentStatus": "pending",
      "orderStatus": "pending",
      "totalAmount": 2598,
      "createdAt": "2025-11-29T00:00:00.000Z"
    }
  ]
}
```

#### Get Specific Order
```
GET /api/orders/:orderId
Authorization: Bearer {token}

Response:
{
  "_id": "...",
  "orderNumber": "ORD-ABC123-XYZ",
  "items": [...],
  "deliveryAddress": {...},
  "paymentMethod": "CoD",
  "paymentStatus": "pending",
  "orderStatus": "pending",
  "totalAmount": 2598,
  "createdAt": "2025-11-29T00:00:00.000Z"
}
```

#### Get All Orders (Admin Only)
```
GET /api/orders/all/list
Authorization: Bearer {admin_token}

Response:
{
  "count": 25,
  "orders": [
    {
      "_id": "...",
      "orderNumber": "ORD-ABC123-XYZ",
      "user": {
        "_id": "...",
        "email": "user@example.com",
        "name": "John Doe"
      },
      "items": [...],
      "deliveryAddress": {...},
      "paymentMethod": "CoD",
      "paymentStatus": "pending",
      "orderStatus": "pending",
      "totalAmount": 2598,
      "createdAt": "2025-11-29T00:00:00.000Z"
    }
  ]
}
```

#### Update Order Status (Admin Only)
```
PUT /api/orders/:orderId/status
Authorization: Bearer {admin_token}
Content-Type: application/json

Body:
{
  "orderStatus": "processing" | "shipped" | "delivered" | "cancelled",
  "paymentStatus": "pending" | "paid" | "failed"
}

Response:
{
  "message": "Order status updated successfully",
  "order": {...}
}
```

---

### Address Management

#### Create Address (No Region Field)
```
POST /api/address/add
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "street": "123 Main St",
  "city": "Manila",
  "state": "NCR",
  "zipCode": "1000",
  "country": "Philippines",
  "isDefault": true
}

Response:
[
  {
    "_id": "...",
    "street": "123 Main St",
    "city": "Manila",
    "state": "NCR",
    "zipCode": "1000",
    "country": "Philippines",
    "isDefault": true
  }
]
```

---

## Order Flow

1. **User adds items to cart** → `POST /api/cart/add`
2. **User views cart** → `GET /api/user/cart`
3. **User proceeds to checkout** → Frontend prepares order data
4. **User creates order** → `POST /api/orders/create`
   - Backend validates stock
   - Backend reduces product quantities
   - Backend creates order record
5. **Frontend clears cart** → `DELETE /api/cart/clear`
6. **User views order history** → `GET /api/orders`

## Wishlist Flow

1. **User adds product to wishlist** → `POST /api/wishlist/add`
2. **User views wishlist** → `GET /api/wishlist`
3. **User adds wishlist item to cart** → Frontend calls `POST /api/cart/add`
4. **User removes from wishlist** → `DELETE /api/wishlist/:productId`

## Testing

Run the test script:
```powershell
.\test-new-features.ps1
```

This will test all new endpoints including:
- Profile updates
- Wishlist operations
- Order creation
- Address management
