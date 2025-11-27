# Password Reset Setup Guide

## 📧 Gmail Configuration

To enable password reset emails, you need to configure Gmail with an **App Password** (not your regular Gmail password).

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Go to **Security** → **2-Step Verification**
2. Scroll down to **App passwords**
3. Click **Select app** → Choose **Mail**
4. Click **Select device** → Choose **Other (Custom name)**
5. Enter "CConnect Backend" or any name
6. Click **Generate**
7. Copy the 16-character password (remove spaces)

### Step 3: Update .env File
Add these variables to your `.env` file (NOT `.env.sample`):

```env
# Email Configuration for Password Reset
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM_NAME=CConnect

# Frontend URL for password reset links
FRONTEND_URL=http://localhost:3000
```

**Important Notes:**
- Use the **App Password**, not your regular Gmail password
- Remove any spaces from the app password
- Update `FRONTEND_URL` to match your frontend application URL

---

## 🔐 Password Reset API Endpoints

### 1. Request Password Reset
**POST** `/api/password-reset/request`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "message": "Password reset link has been sent to your email."
}
```

**Response (Google Sign-In User):**
```json
{
  "error": "This account uses Google Sign-In. Password reset is not available for Google accounts."
}
```

---

### 2. Verify Reset Token
**GET** `/api/password-reset/verify?token=xxx&userId=xxx`

**Query Parameters:**
- `token` - Reset token from email link
- `userId` - User ID from email link

**Response (Valid):**
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

**Response (Invalid/Expired):**
```json
{
  "valid": false,
  "error": "Invalid or expired reset token"
}
```

---

### 3. Reset Password
**POST** `/api/password-reset/reset`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "userId": "user-id-from-email",
  "newPassword": "newSecurePassword123"
}
```

**Response (Success):**
```json
{
  "message": "Password has been reset successfully"
}
```

**Response (Error):**
```json
{
  "error": "Invalid or expired reset token"
}
```

---

## 🧪 Testing the Password Reset Flow

### Using PowerShell/Command Line

#### 1. Request Password Reset
```powershell
$body = @{
    email = "test@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/password-reset/request" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

#### 2. Check Your Email
- Open your email inbox
- Look for "Password Reset Request" email
- Click the reset link or copy the token and userId from the URL

#### 3. Verify Token (Optional)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/password-reset/verify?token=YOUR_TOKEN&userId=YOUR_USER_ID" `
    -Method GET
```

#### 4. Reset Password
```powershell
$body = @{
    token = "YOUR_TOKEN_FROM_EMAIL"
    userId = "YOUR_USER_ID_FROM_EMAIL"
    newPassword = "newPassword123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/password-reset/reset" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## 🔄 Password Reset Flow Diagram

```
User                    Backend                     Email Service
  |                        |                              |
  |--Request Reset-------->|                              |
  |   (email)              |                              |
  |                        |--Generate Token------------->|
  |                        |                              |
  |                        |--Send Email----------------->|
  |<-----------------------|                              |
  |  "Email sent"          |                              |
  |                        |                              |
  |<-Reset Link Email------|------------------------------|
  |                        |                              |
  |--Click Link----------->|                              |
  |   (token + userId)     |                              |
  |                        |--Verify Token                |
  |<-Reset Form------------|                              |
  |                        |                              |
  |--Submit New Password-->|                              |
  |   (token + password)   |                              |
  |                        |--Hash Password               |
  |                        |--Update DB                   |
  |                        |--Delete Token                |
  |<-Success Message-------|                              |
```

---

## 🛡️ Security Features

1. **Token Hashing**: Reset tokens are hashed before storage
2. **Auto-Expiry**: Tokens expire after 1 hour
3. **One-Time Use**: Tokens are deleted after successful password reset
4. **Password Hashing**: Passwords are hashed with bcrypt (10 salt rounds)
5. **Google Account Protection**: Users with Google Sign-In cannot reset password
6. **Email Verification**: Reset link sent only to registered email

---

## 🐛 Troubleshooting

### Email Not Sending
- Verify Gmail App Password is correct (16 characters, no spaces)
- Check that 2-Factor Authentication is enabled
- Ensure `EMAIL_USER` and `EMAIL_PASS` are set in `.env`
- Check server logs for email errors

### Token Expired
- Reset tokens expire after 1 hour
- Request a new password reset link

### Invalid Token
- Ensure you're using the complete token from the email
- Token may have already been used
- Request a new password reset link

### Google Sign-In Users
- Users who signed up with Google cannot reset password
- They should use "Sign in with Google" option
