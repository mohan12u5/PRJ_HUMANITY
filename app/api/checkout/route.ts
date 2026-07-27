import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/db';
import { logger } from '@/app/lib/logger';
import { getAuthenticatedUser } from '@/app/lib/request-auth';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart is empty.' }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      const totalAmount = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

      const createdOrder = await tx.order.create({
        data: {
          userId: user.id,
          totalAmount,
          status: 'PENDING'
        }
      });

      await tx.orderItem.createMany({
        data: cartItems.map((item) => ({
          orderId: createdOrder.id,
          productId: item.product.id,
          productName: item.product.name,
          unitPrice: item.product.price,
          quantity: item.quantity
        }))
      });

      await tx.cartItem.deleteMany({ where: { userId: user.id } });

      return createdOrder;
    });

    return NextResponse.json({
      success: true,
      message: 'Order created successfully. Payment integration can be added next.',
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    logger.error('checkout.create_order_failed', error);
    return NextResponse.json({ success: false, message: 'Unable to create order right now.' }, { status: 500 });
  }
}
