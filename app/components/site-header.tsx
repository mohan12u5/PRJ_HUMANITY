'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    const stored = window.localStorage.getItem('humanity-user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem('humanity-user');
    setUser(null);
    router.push('/');
  };

  return (
    <header className="topbar">
      <Link href="/" className="brand-mark">
        <img src="/1000170135.png" alt="Brand logo" className="brand-logo" />
        <span>Humanity</span>
      </Link>

      <nav className="topnav">
        <a href="#collection">Collection</a>
        <a href="#story">Story</a>
        <a href="#contact">Contact</a>
        <Link href="/cart">Cart ({itemCount})</Link>
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
