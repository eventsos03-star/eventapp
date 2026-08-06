import { env } from '../config/env.js';
import { emailLayout } from './layout.js';

export function buildVerifyEmailLink(token: string): string {
  return `${env.CLIENT_URL}/verify-email?token=${token}`;
}

export function verifyEmailTemplate(firstName: string, link: string): string {
  const content = `
    <p>Hi ${firstName},</p>
    <p>Thanks for signing up for EventOS. Please verify your email address to activate your account.</p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${link}" style="background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">
        Verify Email
      </a>
    </p>
    <p>If the button does not work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6366f1;">${link}</p>
    <p>This link expires in 24 hours.</p>
    <p>If you did not create this account, you can safely ignore this email.</p>
  `;
  return emailLayout('Verify your email address', content);
}
