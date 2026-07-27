import { NextResponse } from 'next/server';

import { findUserByLoginIdentifier } from '@/app/lib/auth-storage';
import { sendEmail } from '@/app/lib/email';
import { logger } from '@/app/lib/logger';
import { createPasswordResetToken } from '@/app/lib/password-reset';
import { applyRateLimit, getClientIpAddress } from '@/app/lib/rate-limit';
import { forgotPasswordSchema } from '@/app/lib/schemas';

const GENERIC_MESSAGE = 'If an account exists for that email, password reset instructions have been sent.';

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIpAddress(request);
    const rateLimit = await applyRateLimit(`forgot-password:${ipAddress}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': `${rateLimit.retryAfterSeconds}` } }
      );
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Please provide a valid email address.' }, { status: 400 });
    }

    const user = await findUserByLoginIdentifier(parsed.data.email);

    if (user) {
      const rawToken = await createPasswordResetToken(user.id);
      const resetUrl = `${process.env.APP_BASE_URL || ''}/reset-password?token=${rawToken}`;

      await sendEmail({
        to: user.email,
        subject: 'Reset your Humanity password',
        html: `<p>Hello ${user.name},</p><p>Use the link below to reset your password. This link expires in 30 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
      });
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    logger.error('forgot_password.failed', error);
    return NextResponse.json({ success: false, message: 'We could not process this request right now.' }, { status: 500 });
  }
}
