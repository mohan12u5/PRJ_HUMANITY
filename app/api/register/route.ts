import { NextResponse } from 'next/server';

import {
  emptyRegistrationForm,
  normalizeRegistrationValues,
  type RegistrationFormValues,
  validateRegistrationValues
} from '@/app/lib/auth-validation';
import { createUser, isEmailTaken, isUserIdTaken } from '@/app/lib/auth-storage';

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
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'We could not complete registration right now. Please try again.'
      },
      { status: 500 }
    );
  }
}