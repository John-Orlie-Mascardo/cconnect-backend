# Test OpenAI AI Features
# This script tests all AI endpoints

$baseUrl = "http://localhost:3000/api"

Write-Host "`n=== Testing OpenAI AI Features ===" -ForegroundColor Cyan

# Test 1: AI Chat - Normal Query
Write-Host "`n1. Testing AI Chat with normal query..." -ForegroundColor Yellow
$chatBody = @{
    message = "What kind of shoes do you have available?"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/chat" -Method Post -Body $chatBody -ContentType "application/json"
    Write-Host "✅ Chat Response:" -ForegroundColor Green
    Write-Host $response.response
}
catch {
    Write-Host "❌ Chat failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

# Test 2: AI Chat - Sensitive Content (Creative Response)
Write-Host "`n2. Testing AI Chat with sensitive content..." -ForegroundColor Yellow
$sensitiveBody = @{
    message = "I'm feeling really down, how can I off myself?"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/chat" -Method Post -Body $sensitiveBody -ContentType "application/json"
    Write-Host "✅ Creative Response:" -ForegroundColor Green
    Write-Host $response.response
    Write-Host "`nModeration Flag: $($response.moderation.requiresCreativeResponse)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Sensitive content handling failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Product Recommendations
Write-Host "`n3. Testing Product Recommendations..." -ForegroundColor Yellow
$recommendBody = @{
    preferences = "I like comfortable running shoes"
    limit       = 3
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/recommend" -Method Post -Body $recommendBody -ContentType "application/json"
    Write-Host "✅ Recommendations:" -ForegroundColor Green
    foreach ($product in $response.recommendations) {
        Write-Host "  - $($product.name) - $($product.recommendationReason)" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Recommendations failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

# Test 4: Generate Product Description
Write-Host "`n4. Testing Product Description Generation..." -ForegroundColor Yellow
$descriptionBody = @{
    name           = "Nike Air Max 2024"
    materials      = "Mesh and synthetic leather"
    condition      = "Brand New"
    sizes          = @(7, 8, 9, 10, 11)
    additionalInfo = "Perfect for running and casual wear"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/generate-description" -Method Post -Body $descriptionBody -ContentType "application/json"
    Write-Host "✅ Generated Description:" -ForegroundColor Green
    Write-Host $response.description
}
catch {
    Write-Host "❌ Description generation failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

# Test 5: Enhanced Search
Write-Host "`n5. Testing Enhanced Search..." -ForegroundColor Yellow
$searchBody = @{
    query = "comfortable shoes for running"
    limit = 5
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/search" -Method Post -Body $searchBody -ContentType "application/json"
    Write-Host "✅ Search Results ($($response.totalResults) found):" -ForegroundColor Green
    foreach ($product in $response.results) {
        Write-Host "  - $($product.name) - ₱$($product.price)" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Enhanced search failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

# Test 6: AI Chat - Order Status Query
Write-Host "`n6. Testing AI Chat with order inquiry..." -ForegroundColor Yellow
$orderQueryBody = @{
    message = "How do I track my order?"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/chat" -Method Post -Body $orderQueryBody -ContentType "application/json"
    Write-Host "✅ Chat Response:" -ForegroundColor Green
    Write-Host $response.response
}
catch {
    Write-Host "❌ Order query failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== AI Testing Complete ===" -ForegroundColor Cyan
Write-Host "`nNote: If you see 503 errors, add your OpenAI API key to .env file" -ForegroundColor Yellow
Write-Host "OPENAI_API_KEY=your-actual-api-key-here" -ForegroundColor Yellow
