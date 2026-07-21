import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="page-shell auth-page">
      <section className="auth-card">
        <h1>Privacy Policy</h1>
        <p className="auth-note">
          Humanity uses your account details only for authentication, account security,
          and support services. We do not sell personal data.
        </p>
        <div className="hero-actions">
          <Link href="/login" className="btn btn-primary">Back to Login</Link>
          <Link href="/register" className="btn btn-secondary">Create Account</Link>
        </div>
      </section>
    </main>
  );
}
