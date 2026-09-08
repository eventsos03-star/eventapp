import { env } from '../config/env.js';
import { emailLayout } from './layout.js';

export function buildResetPasswordLink(token: string): string {
  return `${env.CLIENT_URL}/reset-password?token=${token}`;
}

export function forgotPasswordTemplate(
  firstName: string,
  link: string,
): string {
  const content = `
    <p>Hi ${firstName},</p>
    <p>We received a request to reset your EventOS password.</p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${link}" style="background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </p>
    <p>If the button does not work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6366f1;">${link}</p>
    <p>This link expires in 30 minutes.</p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
  `;
  return emailLayout('Reset your password', content);
}
