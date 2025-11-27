# Test Cart and Address Features
$baseUrl = "http://127.0.0.1:3000/api"

# 1. Register a new test user
$email = "carttest_$(Get-Random)@example.com"
$password = "password123"

Write-Host "Creating test user: $email" -ForegroundColor Cyan
$registerResponse = Invoke-RestMethod -Uri "$baseUrl/user/register-traditional" -Method POST -ContentType "application/json" -Body (@{
        email    = $email
        password = $password
    } | ConvertTo-Json)

# 2. Login to get token
Write-Host "Logging in..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/user/login-traditional" -Method POST -ContentType "application/json" -Body (@{
        email    = $email
        password = $password
    } | ConvertTo-Json)

$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Got Token!" -ForegroundColor Green

# 3. Create a dummy product (using existing product route if available, or just mocking one if I can't)
# Assuming there's at least one product in DB, let's fetch products first
Write-Host "Fetching products..." -ForegroundColor Cyan
try {
    $products = Invoke-RestMethod -Uri "$baseUrl/products" -Method GET
    if ($products.Count -eq 0) {
        Write-Host "No products found. Cannot test cart." -ForegroundColor Red
        exit
    }
    $productId = $products[0]._id
    Write-Host "Using Product ID: $productId" -ForegroundColor Green
}
catch {
    Write-Host "Failed to fetch products. Error: $_" -ForegroundColor Red
    exit
}

# 4. Add to Cart
Write-Host "Adding to Cart..." -ForegroundColor Cyan
try {
    $cart = Invoke-RestMethod -Uri "$baseUrl/cart/add" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
            productId = $productId
            quantity  = 2
        } | ConvertTo-Json)
    Write-Host "Item added! Cart Total: $($cart.totalAmount)" -ForegroundColor Green
}
catch {
    Write-Host "Failed to add to cart: $_" -ForegroundColor Red
}

# 5. Get Cart
Write-Host "Getting Cart..." -ForegroundColor Cyan
$cart = Invoke-RestMethod -Uri "$baseUrl/cart" -Method GET -Headers $headers
Write-Host "Cart Items: $($cart.items.Count)" -ForegroundColor Green

# 6. Add Address
Write-Host "Adding Address..." -ForegroundColor Cyan
try {
    $addresses = Invoke-RestMethod -Uri "$baseUrl/address/add" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
            street    = "123 Test St"
            city      = "Test City"
            state     = "TS"
            zipCode   = "12345"
            country   = "Testland"
            isDefault = $true
        } | ConvertTo-Json)
    Write-Host "Address added! Count: $($addresses.Count)" -ForegroundColor Green
}
catch {
    Write-Host "Failed to add address: $_" -ForegroundColor Red
}

# 7. Get Addresses
Write-Host "Getting Addresses..." -ForegroundColor Cyan
$addresses = Invoke-RestMethod -Uri "$baseUrl/address" -Method GET -Headers $headers
Write-Host "Addresses found: $($addresses.Count)" -ForegroundColor Green
