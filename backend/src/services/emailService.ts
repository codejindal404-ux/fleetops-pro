import nodemailer from 'nodemailer';
import { config } from '../config/index.ts';

/**
 * Creates and returns a Nodemailer transporter configured with environment variables
 */
export const getEmailTransporter = () => {
  const host = config.smtp.host || 'smtp.gmail.com';
  const port = config.smtp.port || 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Sends a 6-digit OTP verification email to the user
 */
export const sendOtpEmail = async (email: string, otp: string): Promise<boolean> => {
  if (!config.smtpConfigured) {
    console.warn(
      `\n⚠️ [EmailService] SMTP credentials not configured in .env (EMAIL_USER / EMAIL_PASS missing).\n` +
      `   Please configure EMAIL_USER and EMAIL_PASS (Gmail App Password) in your .env file to enable live email delivery.\n`
    );
    return false;
  }

  const transporter = getEmailTransporter();
  const fromAddress = config.smtp.from || `FleetOps Pro <${config.smtp.user}>`;

  const subject = 'FleetOps Pro - Email Verification OTP';

  const textContent = `Hello,

Your FleetOps Pro verification code is:

${otp}

This OTP is valid for 10 minutes.

Do not share this code with anyone.

If you did not request this verification, please ignore this email.

Regards,
FleetOps Pro Team`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FleetOps Pro - Email Verification OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);">
              <div style="display: inline-block; padding: 6px 14px; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px; margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #f59e0b; text-transform: uppercase;">SECURITY VERIFICATION</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">FleetOps Pro</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Fleet Operations & Intelligent Maintenance</p>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 24px; color: #e2e8f0;">Hello,</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #cbd5e1;">Your FleetOps Pro verification code is:</p>
              
              <!-- OTP Box -->
              <div style="background-color: #020617; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #f59e0b; display: inline-block;">${otp}</span>
              </div>
              
              <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 20px; color: #cbd5e1;">
                This OTP is valid for <strong style="color: #f59e0b;">10 minutes</strong>.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 20px; color: #f87171; font-weight: 600;">
                Do not share this code with anyone.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #64748b;">
                If you did not request this verification, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 32px 32px; border-top: 1px solid #1e293b; text-align: center; background-color: #090d16;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #64748b;">
                Regards,<br>
                <strong style="color: #94a3b8; font-size: 13px;">FleetOps Pro Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log(`✅ [EmailService] OTP email sent successfully to: ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ [EmailService] Failed to send OTP email to ${email}:`, error?.message || error);
    return false;
  }
};

/**
 * Sends a password reset OTP email to the user
 */
export const sendPasswordResetEmail = async (email: string, otp: string): Promise<boolean> => {
  return sendOtpEmail(email, otp);
};
