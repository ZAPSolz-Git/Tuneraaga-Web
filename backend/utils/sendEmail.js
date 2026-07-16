// backend/utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "465"),
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendResetEmail = async (toEmail, resetUrl) => {
  const fromName = process.env.EMAIL_FROM_NAME || "Tune Raaga";
  const fromEmail = process.env.EMAIL_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: "Password Reset — Tune Raaga",
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',sans-serif;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:28px 24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:-0.5px">🎵 Tune Raaga</h1>
        </div>
        <div style="padding:28px 24px">
          <p style="color:#1e293b;font-size:16px;margin:0 0 8px;font-weight:600">Hello,</p>
          <p style="color:#475569;font-size:14px;margin:0 0 24px;line-height:1.7">
            You requested to reset your password.<br>
            Click the button below to set a new password:
          </p>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${resetUrl}" 
               style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;box-shadow:0 4px 12px rgba(59,130,246,0.3)">
              Reset Password
            </a>
          </div>
          <div style="background:#f1f5f9;border-radius:8px;padding:14px 16px;margin-bottom:20px">
            <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6">
              ⏱ This link is valid for <strong>1 hour</strong>.<br>
              If you did not request this, ignore this email — your password is safe.
            </p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6">
            Button not working? Copy this link:<br>
            <a href="${resetUrl}" style="color:#3b82f6;word-break:break-all;font-size:11px">${resetUrl}</a>
          </p>
        </div>
        <div style="background:#f1f5f9;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="color:#94a3b8;font-size:11px;margin:0">
            © ${new Date().getFullYear()} Tune Raaga. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(
    `✅ Reset email sent to ${toEmail} — MessageId: ${info.messageId}`,
  );
  return info;
};

module.exports = { sendResetEmail };
