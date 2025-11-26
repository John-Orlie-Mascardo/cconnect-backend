$uri = "http://localhost:3000/api/products"

# Test 1: JSON request (without image)
Write-Host "`n=== Test 1: Creating product with JSON ===" -ForegroundColor Cyan
try {
    $jsonBody = @{
        name = "Flutter Test Product"
        price = 299.99
        description = "Testing from PowerShell"
        productId = "TEST-001"
        size = "Medium"
        materials = "Cotton"
        condition = "New"
        quantity = 10
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json" -Body $jsonBody
    Write-Host "✅ Success! Product created:" -ForegroundColor Green
    Write-Host "   ID: $($response.product._id)"
    Write-Host "   Name: $($response.product.name)"
    Write-Host "   Price: $($response.product.price)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response
}

# Test 2: Get all products
Write-Host "`n=== Test 2: Getting all products ===" -ForegroundColor Cyan
try {
    $products = Invoke-RestMethod -Uri $uri -Method GET
    Write-Host "✅ Found $($products.Count) products:" -ForegroundColor Green
    foreach ($p in $products) {
        Write-Host "   - $($p.name) - `$$($p.price)"
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
