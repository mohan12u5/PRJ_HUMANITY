'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { products } from '@/app/lib/products';
import { AddToCartButton } from '@/app/components/add-to-cart-button';
import { SiteHeader } from '@/app/components/site-header';
import { useCart } from '@/app/components/cart-context';

const heroSlides = [
  {
    src: '/1000170135.png',
    title: 'Introducing Humanity',
    description: 'Minimal outerwear  for a premium look,worn by Human.'
  },
  {
    src: '/Humanity_Slide_1.png',
    title: 'Street Essentials',
    description: 'Sharp everyday pieces with a modern fashion-editorial mood.'
  },
  {
    src: '/Humanity_Slide_2.png',
    title: 'Signature Layers',
    description: 'Soft depth, bold contrast, and a strong '+
  'future Human is here.'
  },
  {
    src: '/Humanity_Slide_3.png',
    title: 'Monochrome Minimal',
    description: 'A high-impact fashion structured look ready to showcase your Human Nature.'
  }
] as const;

export default function HomePage() {
  const { itemCount } = useCart();
  const [activeIndexes, setActiveIndexes] = useState<number[]>(() => products.map(() => 0));
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const totalHeroSlides = heroSlides.length;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndexes((prev) => prev.map((index, productIndex) => {
        const total = products[productIndex]?.images?.length ?? 1;
        return (index + 1) % total;
      }));
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isHeroPaused) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % totalHeroSlides);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isHeroPaused, totalHeroSlides]);

  const showPreviousHeroSlide = () => {
    setActiveHeroSlide((prev) => (prev - 1 + totalHeroSlides) % totalHeroSlides);
  };

  const showNextHeroSlide = () => {
    setActiveHeroSlide((prev) => (prev + 1) % totalHeroSlides);
  };

  return (
    <main className="page-shell">
      <SiteHeader itemCount={itemCount} />

      <section className="hero-card">
        <div className="hero-copy">
          <div className="hero-brand-banner">
            <div
              className="hero-logo-stage"
              onMouseEnter={() => setIsHeroPaused(true)}
              onMouseLeave={() => setIsHeroPaused(false)}
              onFocus={() => setIsHeroPaused(true)}
              onBlur={() => setIsHeroPaused(false)}
            >
              {heroSlides.map((slide, index) => (
                <div
                  key={slide.src}
                  className={`hero-slide ${index === activeHeroSlide ? 'is-active' : ''}`}
                  aria-hidden={index !== activeHeroSlide}
                >
                  <img
                    src={slide.src}
                    alt={slide.title}
                    className={`hero-slide-image ${index === 0 ? 'hero-slide-image-first' : ''}`}
                  />
                  <div className="hero-slide-overlay" />
                  <div className={`hero-slide-copy ${index === 0 ? 'hero-slide-copy-first' : ''} ${index === 2 ? 'hero-slide-copy-compact' : ''}`}>
                    <span className="hero-slide-kicker">Humanity</span>
                    <h2>{slide.title}</h2>
                    <p>{slide.description}</p>
                  </div>
                </div>
              ))}

              <div className="hero-slide-controls">
                <button
                  type="button"
                  className="hero-slide-control"
                  aria-label="Previous slide"
                  onClick={showPreviousHeroSlide}
                >
                  {'<'}
                </button>
                <button
                  type="button"
                  className="hero-slide-control"
                  aria-label="Next slide"
                  onClick={showNextHeroSlide}
                >
                  {'>'}
                </button>
              </div>
            </div>
            <div className={`hero-slide-dots ${isHeroPaused ? 'is-paused' : ''}`} aria-label="Hero slides">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  className={`hero-slide-dot ${index === activeHeroSlide ? 'is-active' : ''}`}
                  aria-label={`Show slide ${index + 1}`}
                  onClick={() => setActiveHeroSlide(index)}
                />
              ))}
            </div>
          </div>
          <div className="hero-text-block">
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
