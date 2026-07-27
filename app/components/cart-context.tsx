'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/app/lib/products';
import { apiFetch } from '@/app/lib/api-client';

type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CheckoutResult =
  | { success: true; orderId: string }
  | { success: false; message: string };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isAuthenticated: boolean;
  isSyncing: boolean;
  addToCart: (product: Product) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  checkout: () => Promise<CheckoutResult>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readLocalCart(): CartItem[] {
  const savedCart = window.localStorage.getItem('humanity-cart');
  if (!savedCart) {
    return [];
  }

  try {
    return JSON.parse(savedCart);
  } catch {
    window.localStorage.removeItem('humanity-cart');
    return [];
  }
}

function hasStoredUser() {
  return Boolean(window.localStorage.getItem('humanity-user'));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const fetchRemoteCart = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await apiFetch('/api/cart');
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setItems(data.cart.items);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const authenticated = hasStoredUser();
    setIsAuthenticated(authenticated);

    if (authenticated) {
      fetchRemoteCart().finally(() => setIsHydrated(true));
    } else {
      setItems(readLocalCart());
      setIsHydrated(true);
    }
  }, [fetchRemoteCart]);

  useEffect(() => {
    if (!isHydrated || isAuthenticated) {
      return;
    }
    window.localStorage.setItem('humanity-cart', JSON.stringify(items));
  }, [items, isHydrated, isAuthenticated]);

  const addToCart = (product: Product) => {
    if (isAuthenticated) {
      const existing = items.find((item) => item.slug === product.slug);
      const nextQuantity = (existing?.quantity ?? 0) + 1;
      setIsSyncing(true);
      apiFetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ slug: product.slug, quantity: nextQuantity })
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setItems(data.cart.items);
          }
        })
        .finally(() => setIsSyncing(false));
      return;
    }

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
    if (isAuthenticated) {
      setIsSyncing(true);
      apiFetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ slug, quantity })
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setItems(data.cart.items);
          }
        })
        .finally(() => setIsSyncing(false));
      return;
    }

    setItems((currentItems) =>
      currentItems
        .map((item) => (item.slug === slug ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (slug: string) => {
    if (isAuthenticated) {
      setIsSyncing(true);
      apiFetch('/api/cart', {
        method: 'DELETE',
        body: JSON.stringify({ slug })
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setItems(data.cart.items);
          }
        })
        .finally(() => setIsSyncing(false));
      return;
    }

    setItems((currentItems) => currentItems.filter((item) => item.slug !== slug));
  };

  const clearCart = () => {
    if (isAuthenticated) {
      setIsSyncing(true);
      apiFetch('/api/cart', { method: 'DELETE' })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setItems(data.cart.items);
          }
        })
        .finally(() => setIsSyncing(false));
      return;
    }

    setItems([]);
  };

  const checkout = useCallback(async (): Promise<CheckoutResult> => {
    if (!isAuthenticated) {
      return { success: false, message: 'Please log in to complete checkout.' };
    }

    try {
      const response = await apiFetch('/api/checkout', { method: 'POST' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, message: data.message || 'Unable to complete checkout right now.' };
      }

      setItems([]);
      return { success: true, orderId: data.order.id };
    } catch {
      return { success: false, message: 'Unable to complete checkout right now.' };
    }
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      isAuthenticated,
      isSyncing,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      checkout
    }),
    [items, isAuthenticated, isSyncing, checkout]
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

