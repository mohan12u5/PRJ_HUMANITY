'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    gender: '',
    dob: '',
    email: '',
    phone: '',
    userId: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (Object.values(form).some((value) => value.trim() === '')) {
      setError('Please fill in all fields.');
      return;
    }

    const users = JSON.parse(window.localStorage.getItem('humanity-users') || '{}');
    if (users[form.userId]) {
      setError('That user ID is already taken. Choose another one.');
      return;
    }

    users[form.userId] = {
      name: form.name,
      gender: form.gender,
      dob: form.dob,
      email: form.email,
      phone: form.phone,
      password: form.password
    };

    window.localStorage.setItem('humanity-users', JSON.stringify(users));
    router.push('/login');
  };

  return (
    <main className="page-shell auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-note">Register with your details and then login using your User ID and password.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="auth-input" />
          <select name="gender" value={form.gender} onChange={handleChange} className="auth-input">
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <input name="dob" value={form.dob} onChange={handleChange} type="date" placeholder="Date of birth" className="auth-input" />
          <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="Email" className="auth-input" />
          <input name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="Phone number" className="auth-input" />
          <input name="userId" value={form.userId} onChange={handleChange} placeholder="User ID or Email" className="auth-input" />
          <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="Password" className="auth-input" />

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-actions">
            <button type="submit" className="btn btn-primary">Register</button>
            <Link href="/login" className="text-btn">Already registered? Login</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
