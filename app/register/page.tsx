'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  emptyRegistrationForm,
  genderOptions,
  getPasswordStrength,
  normalizeFieldValue,
  normalizeRegistrationValues,
  type RegistrationField,
  type RegistrationFormErrors,
  type RegistrationFormValues,
  validateRegistrationValues
} from '@/app/lib/auth-validation';
import { AuthFooter } from '@/app/components/auth-footer';

const registerHeroSlides = [
  '/1000170135.png'
];

type MessageState = {
  type: 'error' | 'success';
  text: string;
};

const fieldLabels: Record<RegistrationField, string> = {
  name: 'Full Name *',
  gender: 'Gender *',
  dob: 'Date of Birth *',
  email: 'Email Address *',
  phone: 'Phone Number *',
  userId: 'User ID *',
  password: 'Password *'
};

export default function RegisterPage() {
  const genderMenuRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState<RegistrationFormValues>(emptyRegistrationForm);
  const [touched, setTouched] = useState<Partial<Record<RegistrationField, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<RegistrationFormErrors>({});
  const [message, setMessage] = useState<MessageState | null>(null);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [useEmailAsUserId, setUseEmailAsUserId] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const normalizedForm = normalizeRegistrationValues(form, true);
  const clientErrors = validateRegistrationValues(normalizedForm);
  const passwordStrength = getPasswordStrength(form.password);
  const isFormValid = Object.keys(clientErrors).length === 0 && Object.values(normalizedForm).every(Boolean);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!genderMenuRef.current?.contains(event.target as Node)) {
        setIsGenderOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % registerHeroSlides.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const getFieldError = (field: RegistrationField) => {
    if (serverErrors[field]) {
      return serverErrors[field];
    }

    if (hasSubmitted || touched[field]) {
      return clientErrors[field];
    }

    return undefined;
  };

  const updateField = (field: RegistrationField, value: string, finalize = false) => {
    const normalizedValue = normalizeFieldValue(field, value, finalize);

    setForm((current) => ({
      ...current,
      [field]: normalizedValue,
      ...(field === 'email' && useEmailAsUserId ? { userId: normalizedValue } : {})
    }));

    setServerErrors((current) => ({ ...current, [field]: undefined }));
    if (field === 'email' && useEmailAsUserId) {
      setServerErrors((current) => ({ ...current, userId: undefined }));
    }
    setMessage((current) => (current?.type === 'success' ? null : current));
  };

  const handleUseEmailAsUserIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setUseEmailAsUserId(checked);
    setTouched((current) => ({ ...current, userId: true }));
    setServerErrors((current) => ({ ...current, userId: undefined }));
    setMessage((current) => (current?.type === 'success' ? null : current));

    if (checked) {
      setForm((current) => ({
        ...current,
        userId: normalizeFieldValue('email', current.email, true)
      }));
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as RegistrationField;
    setTouched((current) => ({ ...current, [field]: true }));
    updateField(field, event.target.value);
  };

  const handleBlur = (field: RegistrationField) => {
    setTouched((current) => ({ ...current, [field]: true }));
    updateField(field, form[field], true);
  };

  const handleReset = () => {
    setForm(emptyRegistrationForm);
    setTouched({});
    setServerErrors({});
    setMessage(null);
    setHasSubmitted(false);
    setIsGenderOpen(false);
    setShowPassword(false);
    setUseEmailAsUserId(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);
    setMessage(null);

    const submissionValues = normalizeRegistrationValues(form, true);
    const validationErrors = validateRegistrationValues(submissionValues);
    setForm(submissionValues);

    if (Object.keys(validationErrors).length > 0) {
      setServerErrors({});
      setMessage({ type: 'error', text: 'Please correct the highlighted fields and try again.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionValues)
      });

      const result = await response.json();

      if (!response.ok) {
        setServerErrors(result.fieldErrors || {});
        setMessage({
          type: 'error',
          text: result.message || 'We could not complete registration right now. Please try again.'
        });
        return;
      }

      setForm(emptyRegistrationForm);
      setTouched({});
      setServerErrors({});
      setHasSubmitted(false);
      setIsGenderOpen(false);
      setShowPassword(false);
      setUseEmailAsUserId(false);
      setMessage({
        type: 'success',
        text: result.message || 'Registration completed successfully. Your account has been created. You can now log in.'
      });
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-login-hero" aria-label="Humanity brand showcase">
          {registerHeroSlides.map((slide, index) => (
            <img
              key={slide}
              src={slide}
              alt={`Humanity hero slide ${index + 1}`}
              className={`auth-login-hero-image ${index === activeSlide ? 'is-active' : ''}`}
            />
          ))}
          <div className="auth-login-hero-dots" aria-hidden="true">
            {registerHeroSlides.map((slide, index) => (
              <span key={`${slide}-dot`} className={`auth-login-hero-dot ${index === activeSlide ? 'is-active' : ''}`} />
            ))}
          </div>
        </div>

        <div className="auth-brand">
          <span className="brand-wordmark">
            <strong>Humanity</strong>
            <small>Premium Human wear</small>
          </span>
        </div>
        <h1>Create your account</h1>
        <p className="auth-note">Register with your details and then login using your User ID and password.</p>
        {message && (
          <div className={`auth-status ${message.type === 'success' ? 'is-success' : 'is-error'}`}>
            {message.text}
          </div>
        )}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form-grid">
            <div className="auth-field auth-field-full">
              <label htmlFor="name" className="auth-label">{fieldLabels.name}</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                placeholder="Enter your full name"
                className={`auth-input ${getFieldError('name') ? 'is-invalid' : ''}`}
                aria-invalid={Boolean(getFieldError('name'))}
              />
              {getFieldError('name') && <p className="auth-validation-message">{getFieldError('name')}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="gender-trigger" className="auth-label">{fieldLabels.gender}</label>
              <div className="auth-select" ref={genderMenuRef}>
                <input type="hidden" name="gender" value={form.gender} />
                <button
                  id="gender-trigger"
                  type="button"
                  className={`auth-input auth-select-trigger ${form.gender ? 'has-value' : ''} ${isGenderOpen ? 'is-open' : ''} ${getFieldError('gender') ? 'is-invalid' : ''}`}
                  aria-haspopup="listbox"
                  aria-expanded={isGenderOpen}
                  aria-invalid={Boolean(getFieldError('gender'))}
                  onClick={() => {
                    setTouched((current) => ({ ...current, gender: true }));
                    setIsGenderOpen((current) => !current);
                  }}
                >
                  <span>{form.gender || 'Select Gender'}</span>
                  <span className="auth-select-caret" aria-hidden="true">▾</span>
                </button>
                {isGenderOpen && (
                  <div className="auth-select-menu" role="listbox" aria-label="Gender options">
                    {genderOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`auth-select-option ${form.gender === option ? 'is-selected' : ''}`}
                        role="option"
                        aria-selected={form.gender === option}
                        onClick={() => {
                          updateField('gender', option, true);
                          setTouched((current) => ({ ...current, gender: true }));
                          setIsGenderOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {getFieldError('gender') && <p className="auth-validation-message">{getFieldError('gender')}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="dob" className="auth-label">{fieldLabels.dob}</label>
              <input
                id="dob"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                onBlur={() => handleBlur('dob')}
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="DD/MM/YYYY"
                className={`auth-input ${getFieldError('dob') ? 'is-invalid' : ''}`}
                aria-invalid={Boolean(getFieldError('dob'))}
              />
              {getFieldError('dob') && <p className="auth-validation-message">{getFieldError('dob')}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="email" className="auth-label">{fieldLabels.email}</label>
              <input
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                type="email"
                placeholder="Enter your email address"
                className={`auth-input ${getFieldError('email') ? 'is-invalid' : ''}`}
                aria-invalid={Boolean(getFieldError('email'))}
              />
              {getFieldError('email') && <p className="auth-validation-message">{getFieldError('email')}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="phone" className="auth-label">{fieldLabels.phone}</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                onBlur={() => handleBlur('phone')}
                type="tel"
                inputMode="numeric"
                placeholder="Enter your 10-digit phone number"
                className={`auth-input ${getFieldError('phone') ? 'is-invalid' : ''}`}
                aria-invalid={Boolean(getFieldError('phone'))}
              />
              {getFieldError('phone') && <p className="auth-validation-message">{getFieldError('phone')}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="userId" className="auth-label">{fieldLabels.userId}</label>
              <label htmlFor="use-email-as-userid" className="auth-checkline">
                <input
                  id="use-email-as-userid"
                  type="checkbox"
                  checked={useEmailAsUserId}
                  onChange={handleUseEmailAsUserIdChange}
                />
                <span>Use my email address as User ID</span>
              </label>
              <input
                id="userId"
                name="userId"
                value={form.userId}
                onChange={handleChange}
                onBlur={() => handleBlur('userId')}
                maxLength={64}
                disabled={useEmailAsUserId}
                placeholder="Create a unique user ID"
                className={`auth-input ${getFieldError('userId') ? 'is-invalid' : ''}`}
                aria-invalid={Boolean(getFieldError('userId'))}
              />
              <p className="auth-field-hint">Use 5-64 characters. You can enter a unique User ID or choose your email as User ID.</p>
              {getFieldError('userId') && <p className="auth-validation-message">{getFieldError('userId')}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">{fieldLabels.password}</label>
              <div className="auth-password-wrap">
                <input
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
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
              <div className="auth-password-meta">
                <p className={`auth-strength auth-strength-${passwordStrength.tone}`}>Strength: {passwordStrength.label}</p>
                <p className="auth-password-hint">Use 8-15 characters with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.</p>
              </div>
              {getFieldError('password') && <p className="auth-validation-message">{getFieldError('password')}</p>}
            </div>
          </div>

          <div className="auth-actions auth-actions-register">
            <div className="auth-button-group">
              <button type="submit" className="btn btn-primary auth-submit-btn" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? <span className="auth-spinner" aria-hidden="true" /> : null}
                <span>{isSubmitting ? 'Registering...' : 'Register'}</span>
              </button>
              <button type="button" className="btn btn-secondary auth-reset-btn" onClick={handleReset} disabled={isSubmitting}>
                Reset
              </button>
            </div>
            <Link href="/login" className="text-btn">Already registered? Login</Link>
          </div>
        </form>
        <AuthFooter />
      </div>
    </main>
  );
}
