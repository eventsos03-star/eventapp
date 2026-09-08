import { env } from '../config/env.js';
import { sendEmail } from '../services/email.service.js';
import { buildVerifyEmailLink, verifyEmailTemplate } from './verifyEmail.js';
import {
  buildResetPasswordLink,
  forgotPasswordTemplate,
} from './forgotPassword.js';

function logDevLinks(
  label: string,
  frontendLink: string,
  backendPath: string,
): void {
  if (env.NODE_ENV !== 'development') return;
  console.log(`[DEV] ${label} (frontend): ${frontendLink}`);
  console.log(
    `[DEV] ${label} (backend) : http://localhost:${env.PORT}/api${backendPath}`,
  );
}

export async function sendVerifyEmail(
  to: string,
  firstName: string,
  token: string,
): Promise<void> {
  const link = buildVerifyEmailLink(token);
  logDevLinks('Verify email', link, `/auth/verify-email?token=${token}`);
  await sendEmail(
    to,
    'Verify your email address',
    verifyEmailTemplate(firstName, link),
  );
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  token: string,
): Promise<void> {
  const link = buildResetPasswordLink(token);
  logDevLinks('Password reset', link, `/auth/reset-password?token=${token}`);
  await sendEmail(
    to,
    'Reset your password',
    forgotPasswordTemplate(firstName, link),
  );
}
