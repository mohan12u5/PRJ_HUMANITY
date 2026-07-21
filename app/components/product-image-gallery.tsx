'use client';

import { useState } from 'react';
import type { Product } from '@/app/lib/products';

const viewLabels = ['Front', 'Side', 'Back', 'Overall'];

export function ProductImageGallery({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const images = product.detailImages.length ? product.detailImages : product.images;

  const changeZoom = (delta: number) => setZoom((current) => {
    const next = current + delta;
    return Math.min(3, Math.max(1, next));
  });

  return (
    <div className="product-gallery">
      <div className="gallery-image-frame">
        <img
          src={images[activeImage]}
          alt={`${product.name} ${viewLabels[activeImage] ?? `view ${activeImage + 1}`}`}
          className="gallery-image"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>

      <div className="gallery-controls">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            className={index === activeImage ? 'gallery-button active' : 'gallery-button'}
            onClick={() => {
              setActiveImage(index);
              setZoom(1);
            }}
          >
            {viewLabels[index] ?? `View ${index + 1}`}
          </button>
        ))}
      </div>

      <div className="zoom-controls">
        <button type="button" className="zoom-button" onClick={() => changeZoom(-0.25)}>
          Zoom Out
        </button>
        <button type="button" className="zoom-button" onClick={() => changeZoom(0.25)}>
          Zoom In
        </button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
