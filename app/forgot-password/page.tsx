'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiFetch } from '@/app/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const response = await apiFetch('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setStatus({ type: data.success ? 'success' : 'error', message: data.message });
    } catch {
      setStatus({ type: 'error', message: 'We could not process this request right now.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell auth-page">
      <section className="auth-card">
        <h1>Forgot Password</h1>
        <p className="auth-note">
          Enter your account email and we will send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="contact-form">
          <input
            type="email"
            placeholder="Your email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send Reset Link'}
          </button>
          {status.type !== 'idle' && (
            <p className={status.type === 'success' ? 'form-success' : 'form-error'}>{status.message}</p>
          )}
        </form>
        <div className="hero-actions">
          <Link href="/login" className="btn btn-secondary">Back to Login</Link>
        </div>
        <p className="auth-footer">Humanity Clothing • Account security assistance.</p>
      </section>
    </main>
  );
}

