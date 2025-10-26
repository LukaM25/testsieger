
'use client';
import { useState } from 'react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', { method: 'POST', body: form });
    setLoading(false);
    if (!res.ok) return alert('Login fehlgeschlagen');
    window.location.href = '/dashboard';
  }
  return (
    <form onSubmit={onSubmit} className="card max-w-md mx-auto space-y-3">
      <h1 className="text-xl font-semibold">Login</h1>
      <input name="email" type="email" placeholder="E‑Mail" className="border p-2 rounded w-full" required />
      <input name="password" type="password" placeholder="Passwort" className="border p-2 rounded w-full" required />
      <button className="btn btn-primary w-full" disabled={loading}>{loading ? '…' : 'Einloggen'}</button>
    </form>
  );
}
