import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    slug: 'unisex-black-hoodie',
    name: 'Unisex Black Hoodie',
    category: 'Hoodies',
    price: 49,
    description: 'Heavyweight comfort with a soft fleece interior and your logo centered proudly.',
    badge: 'Best Seller',
    colors: ['Black', 'Charcoal'],
    images: ['/model-hoodie-1.jpg', '/model-hoodie-2.png'],
    detailImages: ['/model-hoodie-1.jpg', '/model-hoodie-2.png', '/model-hoodie-3.png', '/model-hoodie-4.png'],
    details: ['Relaxed unisex fit', 'Soft brushed interior', 'Centered logo print']
  },
  {
    slug: 'black-cotton-tshirt',
    name: 'Black Cotton Tee',
    category: 'T-Shirts',
    price: 29,
    description: 'A clean everyday tee made for layering, travel, and daily wear.',
    badge: 'New Drop',
    colors: ['Black', 'White'],
    images: ['/model-tee-1.png', '/model-tee-2.png'],
    detailImages: ['/model-tee-1.png', '/model-tee-2.png', '/model-tee-3.png', '/model-tee-4.png'],
    details: ['Premium cotton blend', 'Classic crew neck', 'Logo print at the center']
  }
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        badge: product.badge,
        colors: product.colors,
        images: product.images,
        detailImages: product.detailImages,
        details: product.details,
        isActive: true
      },
      create: {
        ...product,
        isActive: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
