import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="page-shell auth-page">
      <section className="auth-card">
        <h1>Forgot Password</h1>
        <p className="auth-note">
          Password recovery is currently handled by support verification.
          Please contact our support team to reset your password securely.
        </p>
        <div className="hero-actions">
          <a href="mailto:support@humanity.example" className="btn btn-primary">Contact Support</a>
          <Link href="/login" className="btn btn-secondary">Back to Login</Link>
        </div>
        <p className="auth-footer">Humanity Clothing • Account security assistance.</p>
      </section>
    </main>
  );
}
