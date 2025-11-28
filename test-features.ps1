# Simple test script for CConnect backend features
$baseUrl = "http://localhost:3000/api"

Write-Host "`n🧪 Testing CConnect Backend Features`n" -ForegroundColor Cyan

# Login
Write-Host "1. Testing Login..." -ForegroundColor Yellow
$loginBody = '{"email":"test@example.com","password":"password123"}'

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/user/login-traditional" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "   ✅ Login successful!`n" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Login failed. Creating test user...`n" -ForegroundColor Red
    
    # Try to register
    try {
        $registerBody = '{"email":"test@example.com","password":"password123"}'
        $registerResponse = Invoke-RestMethod -Uri "$baseUrl/user/register-traditional" -Method POST -Body $registerBody -ContentType "application/json"
        Write-Host "   ✅ Test user created! Logging in...`n" -ForegroundColor Green
        
        # Login again
        $loginResponse = Invoke-RestMethod -Uri "$baseUrl/user/login-traditional" -Method POST -Body $loginBody -ContentType "application/json"
        $token = $loginResponse.token
        $headers = @{ "Authorization" = "Bearer $token" }
        Write-Host "   ✅ Login successful!`n" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Failed to create test user: $($_.Exception.Message)`n" -ForegroundColor Red
        exit
    }
}

# Test Profile Update
Write-Host "2. Testing Profile Update..." -ForegroundColor Yellow
$profileBody = '{"name":"John Doe","phone":"+639123456789"}'
try {
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/user/profile" -Method PUT -Headers $headers -Body $profileBody -ContentType "application/json"
    Write-Host "   ✅ Profile updated: $($profileResponse.name), $($profileResponse.phone)`n" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Profile update failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test Get Profile
Write-Host "3. Testing Get Profile..." -ForegroundColor Yellow
try {
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/user/me" -Headers $headers
    Write-Host "   ✅ Profile: $($meResponse.email) - $($meResponse.name)`n" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Get profile failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Get Products
Write-Host "4. Getting Products..." -ForegroundColor Yellow
try {
    $productsResponse = Invoke-RestMethod -Uri "$baseUrl/products" -Headers $headers
    if ($productsResponse.Count -gt 0) {
        $productId = $productsResponse[0]._id
        Write-Host "   ✅ Found product: $($productsResponse[0].name) (ID: $productId)`n" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  No products found. Skipping product-related tests.`n" -ForegroundColor Yellow
        $productId = $null
    }
}
catch {
    Write-Host "   ❌ Get products failed: $($_.Exception.Message)`n" -ForegroundColor Red
    $productId = $null
}

# Test Wishlist
if ($productId) {
    Write-Host "5. Testing Wishlist Add..." -ForegroundColor Yellow
    $wishlistBody = "{`"productId`":`"$productId`"}"
    try {
        $wishlistResponse = Invoke-RestMethod -Uri "$baseUrl/wishlist/add" -Method POST -Headers $headers -Body $wishlistBody -ContentType "application/json"
        Write-Host "   ✅ Added to wishlist! Count: $($wishlistResponse.count)`n" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠️  Add to wishlist: $($_.Exception.Message)`n" -ForegroundColor Yellow
    }

    Write-Host "6. Testing Get Wishlist..." -ForegroundColor Yellow
    try {
        $wishlistResponse = Invoke-RestMethod -Uri "$baseUrl/wishlist" -Headers $headers
        Write-Host "   ✅ Wishlist items: $($wishlistResponse.count)`n" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Get wishlist failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

# Test Address
Write-Host "7. Testing Address Creation (no region)..." -ForegroundColor Yellow
$addressBody = '{"street":"123 Test St","city":"Manila","state":"NCR","zipCode":"1000","country":"Philippines","isDefault":true}'
try {
    $addressResponse = Invoke-RestMethod -Uri "$baseUrl/address/add" -Method POST -Headers $headers -Body $addressBody -ContentType "application/json"
    Write-Host "   ✅ Address created! Total addresses: $($addressResponse.Count)`n" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Address creation: $($_.Exception.Message)`n" -ForegroundColor Yellow
}

# Test Order Creation
if ($productId) {
    Write-Host "8. Testing Order Creation..." -ForegroundColor Yellow
    $orderBody = @"
{
  "items": [
    {
      "productId": "$productId",
      "quantity": 1,
      "size": 9,
      "price": 1299
    }
  ],
  "deliveryAddress": {
    "street": "123 Test St",
    "city": "Manila",
    "state": "NCR",
    "zipCode": "1000",
    "country": "Philippines"
  },
  "paymentMethod": "CoD"
}
"@
    try {
        $orderResponse = Invoke-RestMethod -Uri "$baseUrl/orders/create" -Method POST -Headers $headers -Body $orderBody -ContentType "application/json"
        Write-Host "   ✅ Order created! Number: $($orderResponse.orderNumber), Total: ₱$($orderResponse.totalAmount)`n" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Order creation failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }

    Write-Host "9. Testing Get Orders..." -ForegroundColor Yellow
    try {
        $ordersResponse = Invoke-RestMethod -Uri "$baseUrl/orders" -Headers $headers
        Write-Host "   ✅ Total orders: $($ordersResponse.count)`n" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Get orders failed: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

Write-Host "✅ Testing complete!`n" -ForegroundColor Green
