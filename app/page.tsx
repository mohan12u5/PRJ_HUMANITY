import { getCatalogProducts } from '@/app/lib/catalog';
import { HomeContent } from '@/app/components/home-content';

export default async function HomePage() {
  const products = await getCatalogProducts();
  return <HomeContent products={products} />;
}

