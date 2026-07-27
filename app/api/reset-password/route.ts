import { NextResponse } from 'next/server';

import { revokeAllSessionsForUser } from '@/app/lib/auth-session';
import { updateUserPassword } from '@/app/lib/auth-storage';
import { logger } from '@/app/lib/logger';
import { consumePasswordResetToken } from '@/app/lib/password-reset';
import { applyRateLimit, getClientIpAddress } from '@/app/lib/rate-limit';
import { resetPasswordSchema } from '@/app/lib/schemas';

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIpAddress(request);
    const rateLimit = await applyRateLimit(`reset-password:${ipAddress}`, 10, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': `${rateLimit.retryAfterSeconds}` } }
      );
    }

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Password must be 8-15 characters and the reset link must be valid.' },
        { status: 400 }
      );
    }

    const userId = await consumePasswordResetToken(parsed.data.token);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    await updateUserPassword(userId, parsed.data.password);
    await revokeAllSessionsForUser(userId);

    return NextResponse.json({ success: true, message: 'Your password has been reset. You can now log in.' });
  } catch (error) {
    logger.error('reset_password.failed', error);
    return NextResponse.json({ success: false, message: 'We could not reset your password right now.' }, { status: 500 });
  }
}
