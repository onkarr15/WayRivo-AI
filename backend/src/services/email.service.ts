import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim().length > 0) {
      this.resend = new Resend(env.RESEND_API_KEY.trim());
    }
  }

  /**
   * Dispatches a branded transactional password reset email via Resend
   */
  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    recipientName?: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const fromAddress = env.EMAIL_FROM || 'WayRivo AI <onboarding@resend.dev>';
    const expiryMinutes = env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || 15;
    const displayName = recipientName ? recipientName.trim() : 'Traveler';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your WayRivo AI Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060D1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #060D1A; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header Branding -->
          <tr>
            <td style="padding: 32px 36px; background: linear-gradient(135deg, #0A1324 0%, #0F172A 100%); border-bottom: 1px solid #1E293B;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                      WayRivo <span style="color: #06B6D4;">AI</span>
                      <span style="font-size: 11px; font-weight: 700; color: #06B6D4; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 2px 8px; margin-left: 6px; vertical-align: middle;">2.0</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.3px;">
                Password Reset Request
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #94A3B8;">
                Hello <strong style="color: #F8FAFC;">${displayName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #94A3B8;">
                We received a request to reset the password for your WayRivo AI account. Click the button below to establish a new, secure password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #06B6D4 0%, #2563EB 100%);">
                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px; letter-spacing: 0.2px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Alert -->
              <table role="presentation" width="100%" style="background-color: #131E35; border-left: 4px solid #06B6D4; border-radius: 6px; margin: 24px 0;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="margin: 0; font-size: 13px; line-height: 20px; color: #CBD5E1;">
                      ⏱️ <strong>This reset link is valid for ${expiryMinutes} minutes</strong> and can only be used once.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style="margin: 24px 0 8px 0; font-size: 13px; color: #64748B;">
                If the button above does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 18px; word-break: break-all; color: #06B6D4;">
                ${resetUrl}
              </p>

              <!-- Security Advice -->
              <div style="border-top: 1px solid #1E293B; padding-top: 20px; margin-top: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 20px; color: #64748B;">
                  🛡️ <strong>Did not request this change?</strong> You can safely ignore this email. Your current password remains secure, and no changes will be made to your account.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0A1324; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748B;">
                WayRivo AI • Autonomous Travel Orchestration & Escrow-Protected Marketplace
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                This is an automated system email. Please do not reply directly to this message.
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

    const textContent = `
WayRivo AI 2.0 - Password Reset Request

Hello ${displayName},

We received a request to reset the password for your WayRivo AI account.

Use the following link to choose a new password:
${resetUrl}

This link is valid for ${expiryMinutes} minutes and can only be used once.

If you did not request this password reset, please ignore this email. Your account remains secure.

WayRivo AI - Autonomous Travel Orchestration
    `.trim();

    if (!this.resend) {
      logger.warn('[EMAIL] RESEND_API_KEY is not configured. Email dispatch skipped in current environment.');
      return {
        success: false,
        error: 'RESEND_API_KEY not configured',
      };
    }

    try {
      const response = await this.resend.emails.send({
        from: fromAddress,
        to,
        subject: 'Reset Your WayRivo AI Password',
        html: htmlContent,
        text: textContent,
      });

      if (response.error) {
        logger.error(`[EMAIL] Resend delivery returned error: ${response.error.message}`);
        return {
          success: false,
          error: response.error.message,
        };
      }

      logger.info(`[EMAIL] Password reset email successfully dispatched via Resend (ID: ${response.data?.id})`);
      return {
        success: true,
        id: response.data?.id,
      };
    } catch (err: any) {
      logger.error(`[EMAIL] Failed to send email via Resend: ${err.message}`);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}

export const emailService = new EmailService();

