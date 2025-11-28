# Test script for new CConnect backend features
# Order Management, Wishlist, and Profile endpoints

$baseUrl = "http://localhost:3000/api"

Write-Host "`n🧪 CConnect Backend Features Test Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# First, login to get a token
Write-Host "📝 Step 1: Login to get authentication token..." -ForegroundColor Yellow
$loginBody = @{
    email    = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/user/login-traditional" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "✅ Login successful! Token obtained.`n" -ForegroundColor Green
}
catch {
    Write-Host "❌ Login failed. Please ensure you have a test user created." -ForegroundColor Red
    Write-Host "Create a test user with: email=test@example.com, password=password123`n" -ForegroundColor Yellow
    exit
}

# Test 1: Profile Update
Write-Host "`n📝 Test 1: Update User Profile" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow
$profileBody = @{
    name  = "John Doe"
    phone = "+639123456789"
} | ConvertTo-Json

try {
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/user/profile" -Method PUT -Headers $headers -Body $profileBody -ContentType "application/json"
    Write-Host "✅ Profile updated successfully!" -ForegroundColor Green
    Write-Host "   Name: $($profileResponse.name)" -ForegroundColor White
    Write-Host "   Phone: $($profileResponse.phone)`n" -ForegroundColor White
}
catch {
    Write-Host "❌ Profile update failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 2: Get Profile
Write-Host "`n📝 Test 2: Get User Profile" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow
try {
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/user/me" -Headers $headers
    Write-Host "✅ Profile retrieved successfully!" -ForegroundColor Green
    Write-Host "   Email: $($meResponse.email)" -ForegroundColor White
    Write-Host "   Name: $($meResponse.name)" -ForegroundColor White
    Write-Host "   Phone: $($meResponse.phone)`n" -ForegroundColor White
}
catch {
    Write-Host "❌ Get profile failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 3: Get Products (to get a product ID for testing)
Write-Host "`n📝 Test 3: Get Products for Testing" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow
try {
    $productsResponse = Invoke-RestMethod -Uri "$baseUrl/products" -Headers $headers
    if ($productsResponse.Count -gt 0) {
        $testProductId = $productsResponse[0]._id
        Write-Host "✅ Products retrieved! Using product ID: $testProductId`n" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  No products found. Please add products first.`n" -ForegroundColor Yellow
        $testProductId = $null
    }
}
catch {
    Write-Host "❌ Get products failed: $($_.Exception.Message)`n" -ForegroundColor Red
    $testProductId = $null
}

# Test 4: Add to Wishlist
if ($testProductId) {
    Write-Host "`n📝 Test 4: Add Product to Wishlist" -ForegroundColor Yellow
    Write-Host "------------------------------" -ForegroundColor Yellow
    $wishlistAddBody = @{
        productId = $testProductId
    } | ConvertTo-Json

    try {
        $wishlistAddResponse = Invoke-RestMethod -Uri "$baseUrl/wishlist/add" -Method POST -Headers $headers -Body $wishlistAddBody -ContentType "application/json"
        Write-Host "✅ Product added to wishlist!" -ForegroundColor Green
        Write-Host "   Wishlist count: $($wishlistAddResponse.count)`n" -ForegroundColor White
    }
    catch {
        Write-Host "❌ Add to wishlist failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }

    # Test 5: Get Wishlist
    Write-Host "`n📝 Test 5: Get Wishlist" -ForegroundColor Yellow
    Write-Host "------------------------------" -ForegroundColor Yellow
    try {
        $wishlistResponse = Invoke-RestMethod -Uri "$baseUrl/wishlist" -Headers $headers
        Write-Host "✅ Wishlist retrieved!" -ForegroundColor Green
        Write-Host "   Items in wishlist: $($wishlistResponse.count)" -ForegroundColor White
        if ($wishlistResponse.items.Count -gt 0) {
            Write-Host "   First item: $($wishlistResponse.items[0].name)`n" -ForegroundColor White
        }
    }
    catch {
        Write-Host "❌ Get wishlist failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

# Test 6: Create Address (without region)
Write-Host "`n📝 Test 6: Create Address (No Region Field)" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow
$addressBody = @{
    street    = "123 Test Street"
    city      = "Manila"
    state     = "NCR"
    zipCode   = "1000"
    country   = "Philippines"
    isDefault = $true
} | ConvertTo-Json

try {
    $addressResponse = Invoke-RestMethod -Uri "$baseUrl/address/add" -Method POST -Headers $headers -Body $addressBody -ContentType "application/json"
    Write-Host "✅ Address created successfully (without region field)!" -ForegroundColor Green
    Write-Host "   Address count: $($addressResponse.Count)`n" -ForegroundColor White
}
catch {
    Write-Host "❌ Create address failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 7: Create Order
if ($testProductId) {
    Write-Host "`n📝 Test 7: Create Order" -ForegroundColor Yellow
    Write-Host "------------------------------" -ForegroundColor Yellow
    $orderBody = @{
        items           = @(
            @{
                productId = $testProductId
                quantity  = 1
                size      = 9
                price     = 1299
            }
        )
        deliveryAddress = @{
            street  = "123 Test Street"
            city    = "Manila"
            state   = "NCR"
            zipCode = "1000"
            country = "Philippines"
        }
        paymentMethod   = "CoD"
    } | ConvertTo-Json -Depth 10

    try {
        $orderResponse = Invoke-RestMethod -Uri "$baseUrl/orders/create" -Method POST -Headers $headers -Body $orderBody -ContentType "application/json"
        Write-Host "✅ Order created successfully!" -ForegroundColor Green
        Write-Host "   Order Number: $($orderResponse.orderNumber)" -ForegroundColor White
        Write-Host "   Total Amount: ₱$($orderResponse.totalAmount)" -ForegroundColor White
        Write-Host "   Payment Method: $($orderResponse.paymentMethod)" -ForegroundColor White
        Write-Host "   Order Status: $($orderResponse.orderStatus)`n" -ForegroundColor White
        $testOrderId = $orderResponse.orderId
    }
    catch {
        Write-Host "❌ Create order failed: $($_.Exception.Message)`n" -ForegroundColor Red
        $testOrderId = $null
    }

    # Test 8: Get User Orders
    Write-Host "`n📝 Test 8: Get User Orders" -ForegroundColor Yellow
    Write-Host "------------------------------" -ForegroundColor Yellow
    try {
        $ordersResponse = Invoke-RestMethod -Uri "$baseUrl/orders" -Headers $headers
        Write-Host "✅ Orders retrieved!" -ForegroundColor Green
        Write-Host "   Total orders: $($ordersResponse.count)" -ForegroundColor White
        if ($ordersResponse.orders.Count -gt 0) {
            Write-Host "   Latest order: $($ordersResponse.orders[0].orderNumber)`n" -ForegroundColor White
        }
    }
    catch {
        Write-Host "❌ Get orders failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

# Test 9: Remove from Wishlist
if ($testProductId) {
    Write-Host "`n📝 Test 9: Remove Product from Wishlist" -ForegroundColor Yellow
    Write-Host "------------------------------" -ForegroundColor Yellow
    try {
        $wishlistRemoveResponse = Invoke-RestMethod -Uri "$baseUrl/wishlist/$testProductId" -Method DELETE -Headers $headers
        Write-Host "✅ Product removed from wishlist!" -ForegroundColor Green
        Write-Host "   Wishlist count: $($wishlistRemoveResponse.count)`n" -ForegroundColor White
    }
    catch {
        Write-Host "❌ Remove from wishlist failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
