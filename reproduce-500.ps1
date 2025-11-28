# Reproduction Script for 500 Error
$baseUrl = "http://localhost:3000"
$email = "test_integration@example.com"
$password = "password123"

# 1. Login
Write-Host "Logging in..."
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/user/login-traditional" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "Logged in. Token: $($token.Substring(0, 10))..."

# 2. Get a valid product
Write-Host "Getting a product..."
$products = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get
$product = $products[0]
Write-Host "Using product: $($product.name) ($($product._id))"

# 3. Create Order (Payload causing 500)
Write-Host "Creating order..."
$orderBody = @{
    items           = @(
        @{
            productId = $product._id
            quantity  = 1
            price     = 100
        }
    )
    deliveryAddress = @{
        province      = "Cavite"
        city          = "Bacoor"
        barangay      = "Mabolo"
        postalCode    = "4102"
        streetDetails = "Blk 11 lot 33 addas townhomes"
    }
    paymentMethod   = "CoD"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders/create" -Method Post -Headers @{ Authorization = "Bearer $token" } -Body $orderBody -ContentType "application/json"
    Write-Host "Order created successfully!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "Error creating order: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "Error Body: $errorBody" -ForegroundColor Red
}
