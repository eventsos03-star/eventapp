import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'localhost',
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
});

/**
 * Sends an email. Failures are logged but never thrown, so an email problem
 * never breaks the auth flow in development (e.g. before SMTP creds are set).
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.warn(
      'Could not send email. Check SMTP credentials in .env.',
      error instanceof Error ? error.message : error,
    );
  }
}
