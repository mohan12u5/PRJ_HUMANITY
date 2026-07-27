'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/app/components/cart-context';

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, isAuthenticated, isSyncing, updateQuantity, removeFromCart, clearCart, checkout } = useCart();
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/login?next=/cart');
      return;
    }

    setIsCheckingOut(true);
    setCheckoutMessage(null);

    const result = await checkout();

    if (!result.success) {
      setCheckoutMessage(result.message);
      setIsCheckingOut(false);
      return;
    }

    setIsCheckingOut(false);
    router.push('/orders');
  };

  return (
    <main className="page-shell cart-page">
      <Link href="/" className="back-link">← Continue shopping</Link>
      <section className="section-block cart-card">
        <div className="section-heading">
          <p className="eyebrow">Your cart</p>
          <h2>{items.length === 0 ? 'Your cart is empty' : 'Cart summary'}</h2>
        </div>

        {items.length === 0 ? (
          <p className="empty-state">Add a hoodie or tee to get started.</p>
        ) : (
          <>
            <div className="cart-list">
              {items.map((item) => (
                <div key={item.slug} className="cart-item">
                  <div>
                    <h3>{item.name}</h3>
                    <p>${item.price} each</p>
                  </div>
                  <div className="cart-controls">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.slug, Number(event.target.value))}
                    />
                    <button onClick={() => removeFromCart(item.slug)} className="text-btn">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div>
                <strong>Subtotal: ${subtotal}</strong>
                <p>Shipping and taxes calculated at checkout.</p>
                {!isAuthenticated && <p className="form-error">Log in to save your cart and check out.</p>}
                {checkoutMessage && <p className="form-error">{checkoutMessage}</p>}
              </div>
              <div className="hero-actions">
                <button className="btn btn-secondary" onClick={clearCart} disabled={isSyncing}>Clear Cart</button>
                <button className="btn btn-primary" onClick={handleCheckout} disabled={isCheckingOut || isSyncing}>
                  {isCheckingOut ? 'Processing…' : 'Checkout'}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

