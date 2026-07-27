'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/app/lib/api-client';

type SiteHeaderProps = {
  itemCount: number;
};

type User = {
  userId: string;
  name: string;
};

export function SiteHeader({ itemCount }: SiteHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;

    const stored = window.localStorage.getItem('humanity-user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }

    const validateSession = async () => {
      try {
        const response = await fetch('/api/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok && active) {
          window.localStorage.removeItem('humanity-user');
          window.localStorage.removeItem('humanity-session');
          setUser(null);
        }
      } catch {
        // Keep current UI state on transient network issues.
      }
    };

    validateSession();

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/session', { method: 'DELETE' });
    } finally {
      window.localStorage.removeItem('humanity-user');
      window.localStorage.removeItem('humanity-session');
      setUser(null);
      router.push('/');
    }
  };

  return (
    <header className="topbar">
      <Link href="/" className="brand-mark">
        <span className="brand-wordmark">
          <strong>Humanity</strong>
          <small>Premium Human wear</small>
        </span>
      </Link>

      <nav className="topnav">
        <a href="#collection">Collection</a>
        <a href="#story">Story</a>
        <a href="#contact">Contact</a>
        <Link href="/cart">Cart ({itemCount})</Link>
        {user && <Link href="/orders">Orders</Link>}
        {user ? (
          <div className="auth-panel">
            <span className="auth-greeting">Hi, {user.name}</span>
            <button type="button" className="btn btn-secondary logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-panel">
            <Link href="/login" className="btn btn-secondary register-btn">Login</Link>
            <Link href="/register" className="btn btn-primary register-btn">Register</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
