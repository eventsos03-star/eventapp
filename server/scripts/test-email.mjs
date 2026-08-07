import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const to = process.argv[2] || 'test@example.com';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 2525,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

try {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'EventOS <no-reply@eventos.app>',
    to,
    subject: 'EventOS SMTP test',
    html: '<p>If you can read this, SMTP is configured correctly.</p>',
  });
  console.log(`Test email sent to ${to}: ${info.messageId}`);
} catch (error) {
  console.error('Failed to send test email:', error instanceof Error ? error.message : error);
  process.exit(1);
}
