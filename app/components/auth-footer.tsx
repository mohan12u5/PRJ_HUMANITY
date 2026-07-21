import Link from 'next/link';

export function AuthFooter() {
  return (
    <footer className="auth-footer" aria-label="Authentication footer">
      <p className="auth-footer-copy">© {new Date().getFullYear()} Humanity Clothing. All rights reserved.</p>
      <nav className="auth-footer-links" aria-label="Auth footer links">
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/terms-of-use">Terms of Use</Link>
        <a href="mailto:support@humanity.example">Help / Contact Support</a>
      </nav>
    </footer>
  );
}
