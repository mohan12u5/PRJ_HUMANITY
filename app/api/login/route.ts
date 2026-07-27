import { NextResponse } from 'next/server';

import { createSessionToken, getCookieSecurityOptions, SESSION_COOKIE_NAME, SESSION_WARNING_SECONDS } from '@/app/lib/auth-session';
import { clearLoginFailures, findUserByLoginIdentifier, isAccountLocked, registerLoginFailure, verifyPassword } from '@/app/lib/auth-storage';
import { logger } from '@/app/lib/logger';
import { applyRateLimit, getClientIpAddress } from '@/app/lib/rate-limit';
import { normalizeFieldValue } from '@/app/lib/auth-validation';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIpAddress(request);
    const body = await request.json();
    const loginIdInput =
      typeof body.loginId === 'string'
        ? body.loginId
        : typeof body.userId === 'string'
          ? body.userId
          : '';
    const loginId = normalizeFieldValue('userId', loginIdInput, true);
    const password = normalizeFieldValue('password', typeof body.password === 'string' ? body.password : '', true);
    const rememberMe = Boolean(body.rememberMe);

    const rateLimit = await applyRateLimit(`login:${ipAddress}:${loginId || 'unknown'}`, 8, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many login attempts. Please try again later.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': `${rateLimit.retryAfterSeconds}`
          }
        }
      );
    }

    if (!loginId || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide valid credentials.',
          fieldErrors: {
            loginId: !loginId ? 'User ID or Email is required.' : undefined,
            password: !password ? 'Password is required.' : undefined
          }
        },
        { status: 400 }
      );
    }

    if (loginId.length > 64 || (loginId.includes('@') && !emailPattern.test(loginId.toLowerCase()))) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide valid credentials.',
          fieldErrors: {
            loginId: 'Please enter a valid User ID or Email.'
          }
        },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 15) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide valid credentials.',
          fieldErrors: {
            password: 'Password must be between 8 and 15 characters.'
          }
        },
        { status: 400 }
      );
    }

    const matchedUser = await findUserByLoginIdentifier(loginId);

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication failed. Please check your credentials and try again.' },
        { status: 401 }
      );
    }

    if (isAccountLocked(matchedUser)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication failed. Please try again later.'
        },
        { status: 423 }
      );
    }

    if (!verifyPassword(password, matchedUser.passwordHash)) {
      await registerLoginFailure(matchedUser.userId);

      return NextResponse.json(
        { success: false, message: 'Authentication failed. Please check your credentials and try again.' },
        { status: 401 }
      );
    }

    await clearLoginFailures(matchedUser.userId);
    const session = await createSessionToken(matchedUser.userId, matchedUser.name, rememberMe);

    const response = NextResponse.json({
      success: true,
      session: {
        expiresAt: session.expiresAt,
        warningAt: new Date(new Date(session.expiresAt).getTime() - SESSION_WARNING_SECONDS * 1000).toISOString()
      },
      user: {
        userId: matchedUser.userId,
        name: matchedUser.name,
        rememberMe,
        loginId
      }
    });

    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      ...getCookieSecurityOptions(),
      maxAge: session.maxAge
    });

    return response;
  } catch (error) {
    logger.error('login.failed', error);
    return NextResponse.json(
      { success: false, message: 'We could not authenticate right now. Please try again.' },
      { status: 500 }
    );
  }
}