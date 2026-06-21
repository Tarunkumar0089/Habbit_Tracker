const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
};

const isEmailConfigured = () => Boolean(getTransporter());

const sendOtpEmail = async ({ email, otp, name }) => {
  const subject = "Your AI Habit Tracker verification code";
  const text = `Hi ${name},\n\nYour verification code is: ${otp}\n\nIt expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#ea580c">AI Habit Tracker</h2>
      <p>Hi ${name},</p>
      <p>Your verification code is:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111">${otp}</p>
      <p style="color:#666">This code expires in 10 minutes.</p>
    </div>
  `;

  const mailer = getTransporter();
  if (mailer) {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      text,
      html,
    });
    return { sent: true, devOtp: null };
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`\n📧  OTP for ${email}: ${otp}\n`);
    return { sent: false, devOtp: otp };
  }

  throw new Error(
    "Email service is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS."
  );
};

module.exports = { sendOtpEmail, isEmailConfigured };
