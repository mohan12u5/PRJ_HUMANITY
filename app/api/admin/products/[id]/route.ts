import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/db';
import { logger } from '@/app/lib/logger';
import { getAuthenticatedAdmin } from '@/app/lib/request-auth';
import { adminProductUpdateSchema } from '@/app/lib/schemas';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = adminProductUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid product payload.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: parsed.data
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    logger.error('admin.products_update_failed', error);
    return NextResponse.json({ success: false, message: 'Unable to update product right now.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
  }

  try {
    await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('admin.products_delete_failed', error);
    return NextResponse.json({ success: false, message: 'Unable to remove product right now.' }, { status: 500 });
  }
}
