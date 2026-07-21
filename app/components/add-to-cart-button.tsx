'use client';

import { useCart } from '@/app/components/cart-context';
import type { Product } from '@/app/lib/products';

export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <button className="btn btn-primary" onClick={() => addToCart(product)}>
      Add to Cart
    </button>
  );
}
