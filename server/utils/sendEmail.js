const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = (process.env.SMTP_USER || '').trim();
  const cleanPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const sendVerificationEmail = async (email, otp) => {
  const userEmail = (process.env.SMTP_USER || '').trim();
  const userPass = (process.env.SMTP_PASS || '').trim();

  console.log(`\n======================================================`);
  console.log(`[OTP CODE GENERATED] Recipient: ${email} | OTP Code: ${otp}`);
  console.log(`======================================================\n`);

  if (
    !userEmail ||
    userEmail === 'your-email@gmail.com' ||
    !userPass ||
    userPass === 'your-16-char-app-password'
  ) {
    console.warn('[SMTP WARNING] SMTP_USER or SMTP_PASS is not configured in server/.env.');
    console.warn(`Please set valid Gmail credentials in server/.env. Standard fallback code is: ${otp}`);
    return true;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"AttendEase Support" <${userEmail}>`,
      to: email,
      subject: 'AttendEase - Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome to AttendEase!</h2>
          <p style="font-size: 16px; color: #333333;">Thank you for signing in. To verify your Gmail address, please use the 6-digit verification code below:</p>
          <div style="background-color: #f3f4f6; text-align: center; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #666666;">This code is valid for <strong>10 minutes</strong>. If you did not request this email, please ignore it.</p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999999; text-align: center;">AttendEase Employee Attendance Management System</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Email delivered to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[SMTP ERROR] Failed to send email to ${email}:`, error.message);
    console.warn(`[FALLBACK] You can enter the OTP code from console: ${otp}`);
    return false;
  }
};

module.exports = { sendVerificationEmail };
