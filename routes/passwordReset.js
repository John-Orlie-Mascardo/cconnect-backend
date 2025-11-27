import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.js';
import { PasswordResetToken } from '../models/passwordResetToken.js';
import { sendEmail } from '../utils/sendEmail.js';

const router = express.Router();

/**
 * 🔹 Request Password Reset
 * POST /api/password-reset/request
 * Body: { email }
 */
router.post('/request', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.status(200).json({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        // Note: We allow all users (including Google Sign-In users) to set a password
        // This enables dual authentication: users can log in with both Google and email/password

        // Delete any existing reset tokens for this user
        await PasswordResetToken.deleteMany({ owner: user._id });

        // Generate random reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash the token before storing
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Create new password reset token
        const passwordResetToken = new PasswordResetToken({
            owner: user._id,
            token: hashedToken
        });
        await passwordResetToken.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;

        // Email HTML template
        const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested to reset your password for your CConnect account.</p>
              <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
              <p><strong>Note:</strong> If you signed up with Google, setting a password will allow you to log in with both Google and email/password.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CConnect. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        // Send email
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            html: emailHtml
        });

        console.log('✅ Password reset email sent to:', email);
        res.status(200).json({
            message: 'Password reset link has been sent to your email.'
        });

    } catch (error) {
        console.error('❌ Password reset request error:', error.message);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});

/**
 * 🔹 Reset Password
 * POST /api/password-reset/reset
 * Body: { token, userId, newPassword }
 */
router.post('/reset', async (req, res) => {
    try {
        const { token, userId, newPassword } = req.body;

        // Validate input
        if (!token || !userId || !newPassword) {
            return res.status(400).json({ error: 'Token, userId, and newPassword are required' });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Find user
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Invalid reset link' });
        }

        // Hash the provided token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid reset token
        const resetToken = await PasswordResetToken.findOne({
            owner: userId,
            token: hashedToken
        });

        if (!resetToken) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        user.password = hashedPassword;
        await user.save();

        // Delete the used reset token
        await PasswordResetToken.findByIdAndDelete(resetToken._id);

        console.log('✅ Password reset successful for:', user.email);
        res.status(200).json({ message: 'Password has been reset successfully' });

    } catch (error) {
        console.error('❌ Password reset error:', error.message);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

/**
 * 🔹 Verify Reset Token
 * GET /api/password-reset/verify?token=xxx&userId=xxx
 * Query params: token, userId
 */
router.get('/verify', async (req, res) => {
    try {
        const { token, userId } = req.query;

        if (!token || !userId) {
            return res.status(400).json({ error: 'Token and userId are required' });
        }

        // Find user
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Invalid reset link' });
        }

        // Hash the provided token
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid reset token
        const resetToken = await PasswordResetToken.findOne({
            owner: userId,
            token: hashedToken
        });

        if (!resetToken) {
            return res.status(400).json({ valid: false, error: 'Invalid or expired reset token' });
        }

        res.status(200).json({ valid: true, email: user.email });

    } catch (error) {
        console.error('❌ Token verification error:', error.message);
        res.status(500).json({ error: 'Failed to verify token' });
    }
});

export const passwordResetRoutes = router;
