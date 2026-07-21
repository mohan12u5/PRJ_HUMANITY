'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { products } from '@/app/lib/products';
import { AddToCartButton } from '@/app/components/add-to-cart-button';
import { SiteHeader } from '@/app/components/site-header';
import { useCart } from '@/app/components/cart-context';

export default function HomePage() {
  const { itemCount } = useCart();
  const [activeIndexes, setActiveIndexes] = useState<number[]>(() => products.map(() => 0));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndexes((prev) => prev.map((index, productIndex) => {
        const total = products[productIndex]?.images?.length ?? 1;
        return (index + 1) % total;
      }));
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="page-shell">
      <SiteHeader itemCount={itemCount} />

      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Humanity Clothing</p>
          <h1>Wear your story with confidence.</h1>
          <p>
            A premium fashion experience shaped for bold individuals who want timeless style with a modern edge.
          </p>
          <div className="hero-actions">
            <a href="#collection" className="btn btn-primary">Explore Collection</a>
            <a href="#contact" className="btn btn-secondary">Join the List</a>
          </div>
        </div>
        <div className="hero-panel">
          <div className="glass-card">
            <p className="mini-label">Featured Drop</p>
            <h3>Monochrome Luxe</h3>
            <p>Elevated essentials designed to move with you.</p>
          </div>
        </div>
      </section>

      <section id="collection" className="section-block">
        <div className="section-heading">
          <p className="eyebrow">Curated Style</p>
          <h2>Designed for every moment.</h2>
        </div>
        <div className="product-grid">
          {products.map((product, productIndex) => (
            <article key={product.slug} className="product-card">
              <img
                src={product.images[activeIndexes[productIndex]]}
                alt={product.name}
                className="product-card-image"
              />
              <span className="product-badge">{product.badge}</span>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="product-meta">
                <span className="price-tag">${product.price}</span>
                <Link href={`/products/${product.slug}`} className="text-btn">View</Link>
              </div>
              <div className="hero-actions">
                <AddToCartButton product={product} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="story" className="section-block story-grid">
        <div>
          <p className="eyebrow">Our Story</p>
          <h2>Clothing that feels personal and powerful.</h2>
          <p>
            Humanity is built around the belief that style should be expressive, ethical, and unforgettable.
            Every piece is created to help you show up as your best self.
          </p>
        </div>
        <div className="stats-card">
          <div>
            <strong>24/7</strong>
            <span>Support</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>Premium Fabrics</span>
          </div>
          <div>
            <strong>4.9/5</strong>
            <span>Rated by Customers</span>
          </div>
        </div>
      </section>

      <section id="contact" className="section-block contact-card">
        <div>
          <p className="eyebrow">Stay Connected</p>
          <h2>Let your audience know when new drops arrive.</h2>
          <p>Share your logo, brand values, and launch updates with a polished experience.</p>
        </div>
        <form action="/api/contact" method="post" className="contact-form">
          <input name="name" placeholder="Your name" required />
          <input name="email" type="email" placeholder="Your email" required />
          <textarea name="message" placeholder="Tell us about your brand or launch" required />
          <button type="submit" className="btn btn-primary">Send Message</button>
        </form>
      </section>

      <footer className="footer">
        <p>© 2026 Humanity Clothing. Built for modern expression.</p>
      </footer>
    </main>
  );
}
