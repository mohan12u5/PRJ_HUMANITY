import Link from 'next/link';

export default function TermsOfUsePage() {
  return (
    <main className="page-shell auth-page">
      <section className="auth-card">
        <h1>Terms of Use</h1>
        <p className="auth-note">
          By using this application, you agree to follow platform rules,
          maintain secure credentials, and use the service responsibly.
        </p>
        <div className="hero-actions">
          <Link href="/login" className="btn btn-primary">Back to Login</Link>
          <Link href="/register" className="btn btn-secondary">Create Account</Link>
        </div>
      </section>
    </main>
  );
}
