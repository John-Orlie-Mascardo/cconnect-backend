# Quick endpoint test
$baseUrl = "http://localhost:3000/api"

Write-Host "`nQuick API Test`n" -ForegroundColor Cyan

# Login
$loginBody = '{"email":"test@example.com","password":"password123"}'
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/user/login-traditional" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $token = $loginResponse.token
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Host "✅ Logged in as: $($loginResponse.email)" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))...`n" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Login failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit
}

# Test each endpoint
Write-Host "Testing Profile Endpoint..." -ForegroundColor Yellow
try {
    $me = Invoke-RestMethod -Uri "$baseUrl/user/me" -Headers $headers -ErrorAction Stop
    Write-Host "✅ GET /api/user/me - Email: $($me.email), Name: $($me.name)" -ForegroundColor Green
}
catch {
    Write-Host "❌ GET /api/user/me failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`nTesting Profile Update..." -ForegroundColor Yellow
try {
    $profileBody = '{"name":"Test User","phone":"+639123456789"}'
    $profile = Invoke-RestMethod -Uri "$baseUrl/user/profile" -Method PUT -Headers $headers -Body $profileBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ PUT /api/user/profile - Updated to: $($profile.name)" -ForegroundColor Green
}
catch {
    Write-Host "❌ PUT /api/user/profile failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`nTesting Wishlist..." -ForegroundColor Yellow
try {
    $wishlist = Invoke-RestMethod -Uri "$baseUrl/wishlist" -Headers $headers -ErrorAction Stop
    Write-Host "✅ GET /api/wishlist - Items: $($wishlist.count)" -ForegroundColor Green
}
catch {
    Write-Host "❌ GET /api/wishlist failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`nTesting Orders..." -ForegroundColor Yellow
try {
    $orders = Invoke-RestMethod -Uri "$baseUrl/orders" -Headers $headers -ErrorAction Stop
    Write-Host "✅ GET /api/orders - Count: $($orders.count)" -ForegroundColor Green
}
catch {
    Write-Host "❌ GET /api/orders failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n✅ Core endpoints working!`n" -ForegroundColor Green
