# Test Admin Order Management Endpoints

$baseUrl = "http://localhost:3000"
$adminEmail = "test_integration@example.com"
$adminPassword = "password123"

Write-Host "========================================"
Write-Host "Testing Admin Order Management"
Write-Host "========================================`n"

# 1. Login as Admin
Write-Host "[1/3] Logging in as Admin..."
try {
    $body = @{
        email    = $adminEmail
        password = $adminPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/user/login-traditional" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    $token = $response.token
    Write-Host "[PASS] Admin Logged In" -ForegroundColor Green
    Write-Host "       Role: $($response.role)" -ForegroundColor Gray
    
    if ($response.role -ne 'admin') {
        Write-Host "[WARNING] User is not admin! Tests might fail." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "[FAIL] Admin Login Failed: $_" -ForegroundColor Red
    exit 1
}

# 2. Get All Orders (Admin List)
Write-Host "`n[2/3] Testing GET /api/orders/all/list..."
try {
    $headers = @{ Authorization = "Bearer $token" }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders/all/list" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[PASS] Retrieved $($response.count) orders" -ForegroundColor Green
    
    if ($response.orders.Count -gt 0) {
        $firstOrder = $response.orders[0]
        Write-Host "       First Order User: $($firstOrder.user.name) ($($firstOrder.user.email))" -ForegroundColor Gray
        Write-Host "       Phone: $($firstOrder.user.phone)" -ForegroundColor Gray
        
        if ($firstOrder.user.phone) {
            Write-Host "       [CHECK] Phone number present" -ForegroundColor Green
        }
        else {
            Write-Host "       [WARNING] Phone number missing in user object" -ForegroundColor Yellow
        }
        
        $testOrderId = $firstOrder._id
    }
    else {
        Write-Host "       [INFO] No orders found to verify details" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "[FAIL] Get All Orders Failed: $_" -ForegroundColor Red
}

# 3. Get Specific Order Details (Admin View)
if ($testOrderId) {
    Write-Host "`n[3/3] Testing GET /api/orders/$testOrderId..."
    try {
        $headers = @{ Authorization = "Bearer $token" }
        
        $order = Invoke-RestMethod -Uri "$baseUrl/api/orders/$testOrderId" `
            -Method Get `
            -Headers $headers
        
        Write-Host "[PASS] Retrieved Order Details" -ForegroundColor Green
        Write-Host "       Order ID: $($order.orderNumber)" -ForegroundColor Gray
        Write-Host "       Customer: $($order.user.name)" -ForegroundColor Gray
        Write-Host "       Phone: $($order.user.phone)" -ForegroundColor Gray
        
        if ($order.user.phone) {
            Write-Host "       [CHECK] Phone number present in details view" -ForegroundColor Green
        }
        else {
            Write-Host "       [WARNING] Phone number missing in details view" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "[FAIL] Get Order Details Failed: $_" -ForegroundColor Red
    }
}

Write-Host "`n========================================"
Write-Host "Admin Order Tests Complete!"
Write-Host "========================================`n"
