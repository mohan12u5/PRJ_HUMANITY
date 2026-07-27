import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/db';
import { logger } from '@/app/lib/logger';
import { getAuthenticatedUser } from '@/app/lib/request-auth';
import { cartRemoveSchema, cartUpsertSchema } from '@/app/lib/schemas';

async function getUserCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'asc' }
  });

  const mappedItems = items.map((item) => ({
    slug: item.product.slug,
    name: item.product.name,
    price: item.product.price,
    image: item.product.images[0] || '',
    quantity: item.quantity
  }));

  const subtotal = mappedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items: mappedItems,
    itemCount: mappedItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal
  };
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  const cart = await getUserCart(user.id);
  return NextResponse.json({ success: true, cart });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = cartUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid cart payload.' }, { status: 400 });
    }

    const { slug, quantity } = parsed.data;

    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product || !product.isActive) {
      return NextResponse.json({ success: false, message: 'Product not available.' }, { status: 404 });
    }

    await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId: product.id
        }
      },
      create: {
        userId: user.id,
        productId: product.id,
        quantity
      },
      update: {
        quantity
      }
    });

    const cart = await getUserCart(user.id);
    return NextResponse.json({ success: true, cart });
  } catch (error) {
    logger.error('cart.update_failed', error);
    return NextResponse.json({ success: false, message: 'Unable to update cart right now.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = cartRemoveSchema.safeParse(body);
    const slug = parsed.success ? parsed.data.slug?.trim() ?? '' : '';

    if (!slug) {
      await prisma.cartItem.deleteMany({ where: { userId: user.id } });
    } else {
      const product = await prisma.product.findUnique({ where: { slug } });
      if (product) {
        await prisma.cartItem.deleteMany({
          where: {
            userId: user.id,
            productId: product.id
          }
        });
      }
    }

    const cart = await getUserCart(user.id);
    return NextResponse.json({ success: true, cart });
  } catch (error) {
    logger.error('cart.remove_failed', error);
    return NextResponse.json({ success: false, message: 'Unable to update cart right now.' }, { status: 500 });
  }
}
