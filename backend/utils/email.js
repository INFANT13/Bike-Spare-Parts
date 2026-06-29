const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('=== EMAIL SIMULATION (SMTP CREDENTIALS MISSING) ===');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    console.log('==================================================');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Bike Spare Parts'}" <${process.env.FROM_EMAIL || 'noreply@bikespareparts.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully. MessageId:', info.messageId);
    return info;
  } catch (error) {
    console.error('Nodemailer Error sending email:', error.message);
    // Return true anyway so checkout doesn't fail due to mail server problems
    return true;
  }
};

module.exports = sendEmail;
