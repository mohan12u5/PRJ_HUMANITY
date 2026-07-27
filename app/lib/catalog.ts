import 'server-only';

import { getAllProducts as fallbackProducts, getProductBySlug as fallbackProductBySlug } from '@/app/lib/products';
import { prisma } from '@/app/lib/db';
import { logger } from '@/app/lib/logger';

export type CatalogProduct = {
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  badge: string;
  colors: string[];
  images: string[];
  detailImages: string[];
  details: string[];
};

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  if (!isDatabaseConfigured()) {
    return fallbackProducts();
  }

  try {
    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    if (dbProducts.length === 0) {
      return fallbackProducts();
    }

    return dbProducts.map((product) => ({
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
    }));
  } catch (error) {
    logger.error('catalog.load_failed', error);
    return fallbackProducts();
  }
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  if (!isDatabaseConfigured()) {
    return fallbackProductBySlug(slug) ?? null;
  }

  try {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true }
    });

    if (!product) {
      return fallbackProductBySlug(slug) ?? null;
    }

    return {
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
    };
  } catch (error) {
    logger.error('catalog.load_by_slug_failed', error);
    return fallbackProductBySlug(slug) ?? null;
  }
}
