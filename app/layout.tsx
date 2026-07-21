import './globals.css';
import type { Metadata } from 'next';
import { CartProvider } from '@/app/components/cart-context';

export const metadata: Metadata = {
  title: 'Humanity | Clothing Brand',
  description: 'Premium fashion for modern self-expression.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
