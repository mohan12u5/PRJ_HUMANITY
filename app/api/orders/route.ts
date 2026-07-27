import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/db';
import { logger } from '@/app/lib/logger';
import { getAuthenticatedUser } from '@/app/lib/request-auth';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity
        }))
      }))
    });
  } catch (error) {
    logger.error('orders.list_failed', error);
    return NextResponse.json({ success: false, message: 'Unable to load orders right now.' }, { status: 500 });
  }
}
