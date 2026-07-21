"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SessionPayload = {
  userId: string;
  name: string;
  expiresAt: string;
  warningAt: string;
};

export default function NextPage() {
  const router = useRouter();
  const warningTimerRef = useRef<number | null>(null);
  const expiryTimerRef = useRef<number | null>(null);
  const lastRefreshTimeRef = useRef(0);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [warningMessage, setWarningMessage] = useState('');

  const clearTimers = () => {
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    if (expiryTimerRef.current) {
      window.clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  };

  const scheduleSessionTimers = (payload: SessionPayload) => {
    clearTimers();

    const warningMs = new Date(payload.warningAt).getTime() - Date.now();
    const expiryMs = new Date(payload.expiresAt).getTime() - Date.now();

    if (warningMs > 0) {
      warningTimerRef.current = window.setTimeout(() => {
        setWarningMessage('Your session will expire in about 2 minutes due to inactivity. Please continue activity to stay logged in.');
      }, warningMs);
    }

    if (expiryMs > 0) {
      expiryTimerRef.current = window.setTimeout(() => {
        window.localStorage.removeItem('humanity-user');
        window.localStorage.removeItem('humanity-session');
        router.push('/login');
      }, expiryMs);
    }
  };

  const hydrateSession = (payload: SessionPayload) => {
    setSession(payload);
    setWarningMessage('');
    window.localStorage.setItem('humanity-session', JSON.stringify(payload));
    scheduleSessionTimers(payload);
  };

  const refreshSession = async () => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 60000) {
      return;
    }

    lastRefreshTimeRef.current = now;

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        window.localStorage.removeItem('humanity-user');
        window.localStorage.removeItem('humanity-session');
        router.push('/login');
        return;
      }

      const result = await response.json();
      hydrateSession(result.session as SessionPayload);
    } catch {
      // Keep current session state if network is briefly unavailable.
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const response = await fetch('/api/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          window.localStorage.removeItem('humanity-user');
          window.localStorage.removeItem('humanity-session');
          router.push('/login');
          return;
        }

        const result = await response.json();
        if (isMounted) {
          hydrateSession(result.session as SessionPayload);
        }
      } catch {
        router.push('/login');
      }
    };

    bootstrap();

    const activityEvents: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, refreshSession, { passive: true });
    });

    return () => {
      isMounted = false;
      clearTimers();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, refreshSession);
      });
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' });
    } finally {
      window.localStorage.removeItem('humanity-user');
      window.localStorage.removeItem('humanity-session');
      router.push('/login');
    }
  };

  return (
    <main className="page-shell">
      <section className="section-block">
        {warningMessage && <p className="session-warning">{warningMessage}</p>}
        <div className="section-heading">
          <p className="eyebrow">More</p>
          <h1>Welcome to the next page{session ? `, ${session.name}` : ''}</h1>
          <p>
            This is where users can learn more about your app after login.
            Use the links below to continue shopping, view the cart, or go back home.
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/" className="btn btn-primary">Go to Shop</Link>
          <Link href="/cart" className="btn btn-secondary">View Cart</Link>
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </section>
    </main>
  );
}
