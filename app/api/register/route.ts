import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import {
  emptyRegistrationForm,
  normalizeRegistrationValues,
  type RegistrationFormValues,
  validateRegistrationValues
} from '@/app/lib/auth-validation';
import { createUser, isEmailTaken, isUserIdTaken } from '@/app/lib/auth-storage';
import { logger } from '@/app/lib/logger';
import { applyRateLimit, getClientIpAddress } from '@/app/lib/rate-limit';

function getRequestPayload(body: Partial<RegistrationFormValues>): RegistrationFormValues {
  return {
    name: typeof body.name === 'string' ? body.name : emptyRegistrationForm.name,
    gender: typeof body.gender === 'string' ? body.gender : emptyRegistrationForm.gender,
    dob: typeof body.dob === 'string' ? body.dob : emptyRegistrationForm.dob,
    email: typeof body.email === 'string' ? body.email : emptyRegistrationForm.email,
    phone: typeof body.phone === 'string' ? body.phone : emptyRegistrationForm.phone,
    userId: typeof body.userId === 'string' ? body.userId : emptyRegistrationForm.userId,
    password: typeof body.password === 'string' ? body.password : emptyRegistrationForm.password
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message: 'Server database is not configured. Set DATABASE_URL and restart the app.'
        },
        { status: 503 }
      );
    }

    const ipAddress = getClientIpAddress(request);
    const rateLimit = await applyRateLimit(`register:${ipAddress}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many registration attempts. Please try again later.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': `${rateLimit.retryAfterSeconds}`
          }
        }
      );
    }

    const body = await request.json();
    const values = normalizeRegistrationValues(getRequestPayload(body), true);
    const fieldErrors = validateRegistrationValues(values);

    if (await isEmailTaken(values.email)) {
      fieldErrors.email = 'This email is already registered to another account.';
    }

    if (await isUserIdTaken(values.userId)) {
      fieldErrors.userId = 'User ID already taken. Please choose another one.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please correct the highlighted fields and try again.',
          fieldErrors
        },
        { status: 400 }
      );
    }

    await createUser({ ...values, password: values.password });

    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully. Your account has been created. You can now log in.'
    });
  } catch (error) {
    const knownError = error as { code?: string; meta?: { target?: string[] } };
    if (knownError.code === 'P2002') {
      const target = knownError.meta?.target || [];
      const fieldErrors: Record<string, string> = {};

      if (target.includes('email')) {
        fieldErrors.email = 'This email is already registered to another account.';
      }

      if (target.includes('userId')) {
        fieldErrors.userId = 'User ID already taken. Please choose another one.';
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Please correct the highlighted fields and try again.',
          fieldErrors
        },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed. Please check DATABASE_URL and ensure your Postgres server is running.'
        },
        { status: 503 }
      );
    }

    logger.error('register.failed', error);

    return NextResponse.json(
      {
        success: false,
        message: 'We could not complete registration right now. Please try again.'
      },
      { status: 500 }
    );
  }
}