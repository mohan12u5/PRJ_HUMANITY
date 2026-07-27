import { NextResponse } from 'next/server';

import { prisma } from '@/app/lib/db';
import { products as fallbackProducts } from '@/app/lib/products';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        products: fallbackProducts,
        source: 'fallback'
      });
    }

    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    if (dbProducts.length === 0) {
      return NextResponse.json({
        success: true,
        products: fallbackProducts,
        source: 'fallback'
      });
    }

    return NextResponse.json({
      success: true,
      products: dbProducts.map((product) => ({
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        badge: product.badge,
        colors: product.colors,
        images: product.images,
        detailImages: product.detailImages,
        details: product.details
      })),
      source: 'database'
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load products right now.'
      },
      { status: 500 }
    );
  }
}
