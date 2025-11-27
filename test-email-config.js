import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('🔍 Email Configuration Diagnostic\n');
console.log('==================================\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set (length: ' + process.env.EMAIL_PASS.length + ')' : '❌ Not set'}`);
console.log(`EMAIL_FROM_NAME: ${process.env.EMAIL_FROM_NAME || 'Not set (will use default)'}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || '❌ Not set'}\n`);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Missing required email configuration!');
    console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file\n');
    process.exit(1);
}

// Test email connection
console.log('🧪 Testing Gmail SMTP Connection...\n');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.log('❌ SMTP Connection Failed!');
        console.log('Error:', error.message);
        console.log('\n📝 Common Issues:');
        console.log('1. App Password is incorrect (should be 16 characters)');
        console.log('2. 2-Factor Authentication not enabled on Gmail');
        console.log('3. App Password has spaces (remove all spaces)');
        console.log('4. Using regular Gmail password instead of App Password');
        console.log('\n💡 How to fix:');
        console.log('1. Go to https://myaccount.google.com/security');
        console.log('2. Enable 2-Step Verification');
        console.log('3. Go to App passwords');
        console.log('4. Generate new password for "Mail"');
        console.log('5. Copy the 16-character password (remove spaces)');
        console.log('6. Update EMAIL_PASS in .env file\n');
    } else {
        console.log('✅ SMTP Connection Successful!');
        console.log('Gmail is ready to send emails.\n');

        // Send test email
        console.log('📧 Sending test email...\n');

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'CConnect'}" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: 'Test Email - Password Reset Setup',
            html: `
        <h1>✅ Email Configuration Successful!</h1>
        <p>Your password reset email system is working correctly.</p>
        <p>This is a test email sent from your CConnect backend.</p>
      `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('❌ Failed to send test email:', error.message);
            } else {
                console.log('✅ Test email sent successfully!');
                console.log('Message ID:', info.messageId);
                console.log('\n📬 Check your inbox at:', process.env.EMAIL_USER);
                console.log('\nYour password reset system is ready to use! 🎉\n');
            }
        });
    }
});
