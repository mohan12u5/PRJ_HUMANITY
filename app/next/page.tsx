import Link from 'next/link';

export default function NextPage() {
  return (
    <main className="page-shell">
      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">More</p>
          <h1>Welcome to the next page</h1>
          <p>
            This is where users can learn more about your app after login.
            Use the links below to continue shopping, view the cart, or go back home.
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/" className="btn btn-primary">Go to Shop</Link>
          <Link href="/cart" className="btn btn-secondary">View Cart</Link>
        </div>
      </section>
    </main>
  );
}
