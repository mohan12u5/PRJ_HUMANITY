'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/app/lib/api-client';

type OrderItem = {
  productName: string;
  unitPrice: number;
  quantity: number;
};

type Order = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await apiFetch('/api/orders');
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.message || 'Unable to load your orders.');
          return;
        }

        setOrders(data.orders);
      } catch {
        setError('Unable to load your orders right now.');
      }
    };

    loadOrders();
  }, []);

  return (
    <main className="page-shell cart-page">
      <Link href="/" className="back-link">← Continue shopping</Link>
      <section className="section-block cart-card">
        <div className="section-heading">
          <p className="eyebrow">Order history</p>
          <h2>Your orders</h2>
        </div>

        {error && <p className="form-error">{error}</p>}

        {!error && !orders && <p className="empty-state">Loading your orders…</p>}

        {orders && orders.length === 0 && <p className="empty-state">You have not placed any orders yet.</p>}

        {orders && orders.length > 0 && (
          <div className="cart-list">
            {orders.map((order) => (
              <div key={order.id} className="cart-item">
                <div>
                  <h3>Order #{order.id.slice(-8).toUpperCase()}</h3>
                  <p>Status: {order.status}</p>
                  <p>{new Date(order.createdAt).toLocaleString()}</p>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.productName} × {item.quantity} — ${item.unitPrice * item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
                <strong>${order.totalAmount}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
