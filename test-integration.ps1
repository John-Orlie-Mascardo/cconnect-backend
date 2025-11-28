# CConnect Integration Testing Script
# Tests all backend endpoints according to the integration guide

$baseUrl = "http://localhost:3000"
$testEmail = "test_integration@example.com"
$testPassword = "password123"
$token = ""

Write-Host "`n========================================"
Write-Host "CConnect Backend Integration Tests"
Write-Host "========================================`n"

# Test 1: Health Check
Write-Host "[1/10] Testing Health Check..."
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    Write-Host "[PASS] Health Check: $($response.status) - $($response.message)" -ForegroundColor Green
}
catch {
    Write-Host "[FAIL] Health Check Failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Register Traditional User
Write-Host "`n[2/10] Testing User Registration..."
try {
    $body = @{
        email    = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/register-traditional" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "[PASS] User Registered: $($response.email)" -ForegroundColor Green
}
catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "[INFO] User already exists (expected)" -ForegroundColor Yellow
    }
    else {
        Write-Host "[FAIL] Registration Failed: $_" -ForegroundColor Red
    }
}

# Test 3: Login Traditional User
Write-Host "`n[3/10] Testing User Login..."
try {
    $body = @{
        email    = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/login-traditional" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    $token = $response.token
    Write-Host "[PASS] Login Successful: $($response.email)" -ForegroundColor Green
    $tokenPreview = $token.Substring(0, 20)
    Write-Host "       Token: $tokenPreview..." -ForegroundColor Gray
}
catch {
    Write-Host "[FAIL] Login Failed: $_" -ForegroundColor Red
    exit 1
}

# Test 4: Get User Profile
Write-Host "`n[4/10] Testing Get User Profile..."
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/me" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[PASS] Profile Retrieved: $($response.email)" -ForegroundColor Green
    Write-Host "       Name: $($response.name)" -ForegroundColor Gray
    Write-Host "       Phone: $($response.phone)" -ForegroundColor Gray
}
catch {
    Write-Host "[FAIL] Get Profile Failed: $_" -ForegroundColor Red
}

# Test 5: Update User Profile
Write-Host "`n[5/10] Testing Update User Profile..."
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $body = @{
        name  = "Integration Test User"
        phone = "+639123456789"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/profile" `
        -Method Put `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "[PASS] Profile Updated: $($response.name)" -ForegroundColor Green
}
catch {
    Write-Host "[FAIL] Update Profile Failed: $_" -ForegroundColor Red
}

# Test 6: Get Addresses
Write-Host "`n[6/10] Testing Get Addresses..."
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/addresses" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[PASS] Addresses Retrieved: $($response.Count) addresses" -ForegroundColor Green
}
catch {
    Write-Host "[FAIL] Get Addresses Failed: $_" -ForegroundColor Red
}

# Test 7: Create Address (Philippine Format)
Write-Host "`n[7/10] Testing Create Address (Philippine Format)..."
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $body = @{
        province      = "Metro Manila"
        city          = "Quezon City"
        barangay      = "Barangay Commonwealth"
        postalCode    = "1100"
        streetDetails = "123 Test Street, Building A, Unit 5"
        isDefault     = $true
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/addresses" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "[PASS] Address Created: $($response.Count) total addresses" -ForegroundColor Green
    Write-Host "       Format: province, city, barangay, postalCode, streetDetails" -ForegroundColor Gray
}
catch {
    Write-Host "[FAIL] Create Address Failed: $_" -ForegroundColor Red
}

# Test 8: Get Wishlist
Write-Host "`n[8/10] Testing Get Wishlist..."
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/wishlist" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[PASS] Wishlist Retrieved: $($response.count) items" -ForegroundColor Green
}
catch {
    Write-Host "[FAIL] Get Wishlist Failed: $_" -ForegroundColor Red
}

# Test 9: Get Orders
Write-Host "`n[9/10] Testing Get Orders..."
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[PASS] Orders Retrieved: $($response.count) orders" -ForegroundColor Green
}
catch {
    Write-Host "[FAIL] Get Orders Failed: $_" -ForegroundColor Red
}

# Test 10: Get Cart
Write-Host "`n[10/10] Testing Get Cart..."
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/cart" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[PASS] Cart Retrieved: $($response.items.Count) items" -ForegroundColor Green
}
catch {
    Write-Host "[FAIL] Get Cart Failed: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================"
Write-Host "Integration Tests Complete!"
Write-Host "========================================`n"

Write-Host "Test User Credentials:"
Write-Host "  Email: $testEmail"
Write-Host "  Password: $testPassword"
if ($token) {
    $tokenPreview = $token.Substring(0, 30)
    Write-Host "  Token: $tokenPreview..."
}
Write-Host ""
