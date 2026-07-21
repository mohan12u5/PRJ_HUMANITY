'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { normalizeFieldValue } from '@/app/lib/auth-validation';
import { AuthFooter } from '@/app/components/auth-footer';

const loginHeroSlides = [
  '/1000170135.png'
];

type LoginFormValues = {
  loginId: string;
  password: string;
  rememberMe: boolean;
};

type LoginFormErrors = {
  loginId?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.loginId.trim()) {
    errors.loginId = 'User ID or Email is required.';
  } else if (values.loginId.length > 64) {
    errors.loginId = 'User ID or Email must be 64 characters or fewer.';
  } else if (values.loginId.includes('@') && !emailPattern.test(values.loginId.toLowerCase())) {
    errors.loginId = 'Please enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8 || values.password.length > 15) {
    errors.password = 'Password must be between 8 and 15 characters.';
  }

  return errors;
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFormValues>(() => {
    if (typeof window === 'undefined') {
      return { loginId: '', password: '', rememberMe: false };
    }

    const remembered = window.localStorage.getItem('humanity-remembered-login-id') || '';
    return { loginId: remembered, password: '', rememberMe: Boolean(remembered) };
  });
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormValues, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const validationErrors = useMemo(() => validateLogin(form), [form]);
  const isFormValid = Object.keys(validationErrors).length === 0;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % loginHeroSlides.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const getFieldError = (field: keyof LoginFormErrors) => {
    if (fieldErrors[field]) {
      return fieldErrors[field];
    }

    if (touched[field]) {
      return validationErrors[field];
    }

    return undefined;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = event.target;

    if (name === 'rememberMe') {
      setForm((current) => ({ ...current, rememberMe: checked }));
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: normalizeFieldValue(name as 'userId' | 'password', value)
    }));

    if (type !== 'checkbox') {
      setTouched((current) => ({ ...current, [name]: true }));
      setFieldErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setMessage('');
    setTouched({ loginId: true, password: true });

    const loginId = normalizeFieldValue('userId', form.loginId, true);
    const password = normalizeFieldValue('password', form.password, true);
    const submissionValues = {
      ...form,
      loginId,
      password
    };

    setForm(submissionValues);
    const clientErrors = validateLogin(submissionValues);

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setMessage('Please correct the highlighted fields.');
      return;
    }

    setFieldErrors({});

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ loginId, password, rememberMe: submissionValues.rememberMe })
      });

      const result = await response.json();

      if (!response.ok) {
        setFieldErrors(result.fieldErrors || {});
        setMessage(result.message || 'Authentication failed. Please check your credentials and try again.');
        return;
      }

      if (submissionValues.rememberMe) {
        window.localStorage.setItem('humanity-remembered-login-id', loginId);
      } else {
        window.localStorage.removeItem('humanity-remembered-login-id');
      }

      window.localStorage.setItem('humanity-user', JSON.stringify(result.user));
      window.localStorage.setItem('humanity-session', JSON.stringify(result.session));
      router.push('/next');
    } catch {
      setMessage('We could not authenticate right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell auth-page">
      <div className="auth-card">
        <div className="auth-login-hero" aria-label="Humanity brand showcase">
          {loginHeroSlides.map((slide, index) => (
            <img
              key={slide}
              src={slide}
              alt={`Humanity hero slide ${index + 1}`}
              className={`auth-login-hero-image ${index === activeSlide ? 'is-active' : ''}`}
            />
          ))}
          <div className="auth-login-hero-dots" aria-hidden="true">
            {loginHeroSlides.map((slide, index) => (
              <span key={`${slide}-dot`} className={`auth-login-hero-dot ${index === activeSlide ? 'is-active' : ''}`} />
            ))}
          </div>
        </div>

        <h1>Login to Humanity</h1>
        <p className="auth-note">Use your User ID or Email and password to access your account securely.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="loginId" className="auth-label">User ID or Email *</label>
            <input
              id="loginId"
              name="loginId"
              value={form.loginId}
              onChange={handleChange}
              onBlur={() => setTouched((current) => ({ ...current, loginId: true }))}
              placeholder="Enter your user ID or email"
              className={`auth-input ${getFieldError('loginId') ? 'is-invalid' : ''}`}
              aria-invalid={Boolean(getFieldError('loginId'))}
              maxLength={64}
            />
            {getFieldError('loginId') && <p className="auth-validation-message">{getFieldError('loginId')}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password *</label>
            <div className="auth-password-wrap">
              <input
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className={`auth-input auth-password-input ${getFieldError('password') ? 'is-invalid' : ''}`}
                aria-invalid={Boolean(getFieldError('password'))}
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {getFieldError('password') && <p className="auth-validation-message">{getFieldError('password')}</p>}
          </div>

          <div className="auth-login-row">
            <label htmlFor="rememberMe" className="auth-checkline">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={form.rememberMe}
                onChange={handleChange}
              />
              <span>Remember Me</span>
            </label>
          </div>

          <div className="auth-login-row auth-login-row-secondary">
            <Link href="/forgot-password" className="text-btn">Forgot Password?</Link>
            <Link href="/register" className="text-btn">Need an account? Register</Link>
          </div>

          {message && <div className="auth-error" role="alert">{message}</div>}

          <div className="auth-actions auth-actions-login">
            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? <span className="auth-spinner" aria-hidden="true" /> : null}
              <span>{isSubmitting ? 'Authenticating...' : 'Login'}</span>
            </button>
          </div>
        </form>

        <AuthFooter />
      </div>
    </main>
  );
}
