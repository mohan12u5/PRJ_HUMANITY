import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { logger } from '@/app/lib/logger';
import { applyRateLimit, getClientIpAddress } from '@/app/lib/rate-limit';
import { contactSchema } from '@/app/lib/schemas';

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIpAddress(request);
    const rateLimit = await applyRateLimit(`contact:${ipAddress}`, 10, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': `${rateLimit.retryAfterSeconds}`
          }
        }
      );
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Please fill all fields.' }, { status: 400 });
    }

    const { name, message } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    await prisma.contactMessage.create({
      data: {
        name,
        email,
        message
      }
    });

    return NextResponse.json({
      success: true,
      message: `Thanks ${name}! Your message has been received.`,
      details: { email, message }
    });
  } catch (error) {
    logger.error('contact.submit_failed', error);
    return NextResponse.json({ success: false, message: 'Something went wrong.' }, { status: 500 });
  }
}

