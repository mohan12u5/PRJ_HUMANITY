'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/app/lib/products';

type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: Product) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = window.localStorage.getItem('humanity-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch {
        window.localStorage.removeItem('humanity-cart');
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('humanity-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.slug === product.slug);
      if (existingItem) {
        return currentItems.map((item) =>
          item.slug === product.slug ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentItems, { slug: product.slug, name: product.name, price: product.price, image: product.images[0], quantity: 1 }];
    });
  };

  const updateQuantity = (slug: string, quantity: number) => {
    setItems((currentItems) =>
      currentItems
        .map((item) => (item.slug === slug ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (slug: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.slug !== slug));
  };

  const clearCart = () => setItems([]);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
