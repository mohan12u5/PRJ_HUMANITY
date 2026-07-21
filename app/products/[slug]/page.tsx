import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/app/components/add-to-cart-button';
import { ProductImageGallery } from '@/app/components/product-image-gallery';
import { getProduct } from '@/app/lib/products';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="page-shell product-page">
      <Link href="/" className="back-link">← Back to shop</Link>
      <section className="hero-card product-hero">
        <div className="hero-copy">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="product-meta">
            <span className="price-tag">${product.price}</span>
            <span className="pill">{product.badge}</span>
          </div>
          <div className="hero-actions">
            <AddToCartButton product={product} />
          </div>
          <ul className="detail-list">
            {product.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
        <div className="hero-panel">
          <ProductImageGallery product={product} />
        </div>
      </section>
    </main>
  );
}
