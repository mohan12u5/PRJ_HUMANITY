'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ userId: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!form.userId.trim() || !form.password.trim()) {
      setError('Please enter your user ID and password.');
      return;
    }

    const users = JSON.parse(window.localStorage.getItem('humanity-users') || '{}');
    const matchedUser = users[form.userId];

    if (!matchedUser || matchedUser.password !== form.password) {
      setError('Invalid user ID or password.');
      return;
    }

    window.localStorage.setItem('humanity-user', JSON.stringify({ userId: form.userId, name: matchedUser.name }));
    router.push('/next');
  };

  return (
    <main className="page-shell auth-page">
      <div className="auth-card">
        <h1>Login to Humanity</h1>
        <p className="auth-note">Use your User ID and password to access your account.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input name="userId" value={form.userId} onChange={handleChange} placeholder="User ID" className="auth-input" />
          <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="Password" className="auth-input" />

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-actions">
            <button type="submit" className="btn btn-primary">Login</button>
            <Link href="/register" className="text-btn">Need an account? Register</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
