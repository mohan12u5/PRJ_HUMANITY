'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { apiFetch } from '@/app/lib/api-client';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setStatus({ type: 'error', message: 'This reset link is invalid. Please request a new one.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const response = await apiFetch('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus({ type: 'error', message: data.message || 'Unable to reset your password right now.' });
        return;
      }

      setStatus({ type: 'success', message: data.message });
      window.setTimeout(() => router.push('/login'), 1500);
    } catch {
      setStatus({ type: 'error', message: 'Unable to reset your password right now.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell auth-page">
      <section className="auth-card">
        <h1>Reset Password</h1>
        <p className="auth-note">Choose a new password (8-15 characters) for your account.</p>
        <form onSubmit={handleSubmit} className="contact-form">
          <input
            type="password"
            placeholder="New password"
            required
            minLength={8}
            maxLength={15}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting…' : 'Reset Password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
