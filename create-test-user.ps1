# Create Test User and Test Password Reset Flow
# This script creates a test user with email/password and tests the password reset

$baseUrl = "http://localhost:3000"
$testEmail = "testuser@example.com"
$testPassword = "password123"

Write-Host "🧪 Testing Password Reset - Full Flow" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Step 1: Create test user with email/password
Write-Host "Step 1: Creating test user with email/password" -ForegroundColor Yellow
Write-Host "-----------------------------------------------" -ForegroundColor Yellow

$registerBody = @{
    email    = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/user/register-traditional" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody
    
    Write-Host "✅ Test user created successfully!" -ForegroundColor Green
    Write-Host "   Email: $testEmail" -ForegroundColor Gray
    Write-Host "   User ID: $($registerResponse.userId)" -ForegroundColor Gray
}
catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "ℹ️  Test user already exists, continuing..." -ForegroundColor Yellow
    }
    else {
        Write-Host "❌ Error creating user: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Details: $($errorObj.error)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Step 2: Request password reset
Write-Host "Step 2: Requesting password reset" -ForegroundColor Yellow
Write-Host "----------------------------------" -ForegroundColor Yellow

$resetRequestBody = @{
    email = $testEmail
} | ConvertTo-Json

try {
    $resetResponse = Invoke-RestMethod -Uri "$baseUrl/api/password-reset/request" `
        -Method POST `
        -ContentType "application/json" `
        -Body $resetRequestBody
    
    Write-Host "✅ Password reset email sent!" -ForegroundColor Green
    Write-Host "   Message: $($resetResponse.message)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error requesting reset: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Details: $($errorObj.error)" -ForegroundColor Red
    }
}

Write-Host "`n======================================`n" -ForegroundColor Cyan
Write-Host "📧 Check your email inbox!" -ForegroundColor Green
Write-Host "   Look for: 'Password Reset Request'" -ForegroundColor Gray
Write-Host "   From: CConnect" -ForegroundColor Gray
Write-Host "`n======================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open the email and click the reset link" -ForegroundColor White
Write-Host "2. Or copy the token and userId from the URL" -ForegroundColor White
Write-Host "3. Use these commands to complete the reset:" -ForegroundColor White
Write-Host ""
Write-Host "# Verify Token:" -ForegroundColor Cyan
Write-Host 'Invoke-RestMethod -Uri "http://localhost:3000/api/password-reset/verify?token=YOUR_TOKEN&userId=YOUR_USER_ID" -Method GET' -ForegroundColor Gray
Write-Host ""
Write-Host "# Reset Password:" -ForegroundColor Cyan
Write-Host '$body = @{ token = "YOUR_TOKEN"; userId = "YOUR_USER_ID"; newPassword = "newPassword456" } | ConvertTo-Json' -ForegroundColor Gray
Write-Host 'Invoke-RestMethod -Uri "http://localhost:3000/api/password-reset/reset" -Method POST -ContentType "application/json" -Body $body' -ForegroundColor Gray
