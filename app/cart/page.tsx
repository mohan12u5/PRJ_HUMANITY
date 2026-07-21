'use client';

import Link from 'next/link';
import { useCart } from '@/app/components/cart-context';

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();

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
              </div>
              <div className="hero-actions">
                <button className="btn btn-secondary" onClick={clearCart}>Clear Cart</button>
                <button className="btn btn-primary">Checkout</button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
