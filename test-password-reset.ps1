# Test Password Reset API
# This script tests the password reset endpoints

# Configuration
$baseUrl = "http://localhost:3000"
$testEmail = "test@example.com"

Write-Host "🧪 Testing Password Reset API" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Request Password Reset
Write-Host "Test 1: Request Password Reset" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

$requestBody = @{
    email = $testEmail
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/password-reset/request" `
        -Method POST `
        -ContentType "application/json" `
        -Body $requestBody
    
    Write-Host "✅ Success: $($response.message)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Details: $($errorObj.error)" -ForegroundColor Red
    }
}

Write-Host "`n================================`n" -ForegroundColor Cyan
Write-Host "📧 Check your email for the reset link!" -ForegroundColor Green
Write-Host "   The link will contain a token and userId" -ForegroundColor Gray
Write-Host "`n================================`n" -ForegroundColor Cyan

# Instructions for next steps
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check your email inbox for 'Password Reset Request'" -ForegroundColor White
Write-Host "2. Copy the token and userId from the reset link" -ForegroundColor White
Write-Host "3. Use the following commands to verify and reset:" -ForegroundColor White
Write-Host ""
Write-Host "# Verify Token:" -ForegroundColor Cyan
Write-Host 'Invoke-RestMethod -Uri "http://localhost:3000/api/password-reset/verify?token=YOUR_TOKEN&userId=YOUR_USER_ID" -Method GET' -ForegroundColor Gray
Write-Host ""
Write-Host "# Reset Password:" -ForegroundColor Cyan
Write-Host '$body = @{ token = "YOUR_TOKEN"; userId = "YOUR_USER_ID"; newPassword = "newPassword123" } | ConvertTo-Json' -ForegroundColor Gray
Write-Host 'Invoke-RestMethod -Uri "http://localhost:3000/api/password-reset/reset" -Method POST -ContentType "application/json" -Body $body' -ForegroundColor Gray
