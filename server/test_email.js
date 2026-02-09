require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('--- Email Configuration Test ---');

    // Check if variables exist
    if (!process.env.EMAIL_USER) {
        console.error('❌ EMAIL_USER is missing in .env');
        return;
    }
    if (!process.env.EMAIL_APP_PASSWORD) {
        console.error('❌ EMAIL_APP_PASSWORD is missing in .env');
        return;
    }

    console.log(`✅ Found EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log('✅ Found EMAIL_APP_PASSWORD (hidden)');

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to self
        subject: 'Test Email from Smart Faculty Directory',
        text: 'If you see this, your email configuration is working correctly!'
    };

    console.log('Attempting to send test email...');

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Response:', info.response);
    } catch (error) {
        console.error('❌ Error sending email:');
        console.error(error);
        if (error.code === 'EAUTH') {
            console.log('\n💡 Tip: This usually means the App Password is incorrect or 2-Step Verification is not enabled.');
        }
    }
}

testEmail();
