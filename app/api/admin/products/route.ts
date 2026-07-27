import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/db';
import { logger } from '@/app/lib/logger';
import { getAuthenticatedAdmin } from '@/app/lib/request-auth';
import { adminProductSchema } from '@/app/lib/schemas';

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
  }

  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, products });
  } catch (error) {
    logger.error('admin.products_list_failed', error);
    return NextResponse.json({ success: false, message: 'Unable to load products right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = adminProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid product payload.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const product = await prisma.product.create({ data: parsed.data });
    return NextResponse.json({ success: true, product });
  } catch (error) {
    const knownError = error as { code?: string };
    if (knownError.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'A product with this slug already exists.' }, { status: 400 });
    }

    logger.error('admin.products_create_failed', error);
    return NextResponse.json({ success: false, message: 'Unable to create product right now.' }, { status: 500 });
  }
}
