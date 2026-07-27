import 'server-only';

import { logger } from '@/app/lib/logger';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'Humanity <no-reply@humanity.example>';

  if (!apiKey) {
    logger.info('email.skip_no_provider', { to, subject });
    return { success: true, delivered: false };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html
    });
    return { success: true, delivered: true };
  } catch (error) {
    logger.error('email.send_failed', error);
    return { success: false, delivered: false };
  }
}
