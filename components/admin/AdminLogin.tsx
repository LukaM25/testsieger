'use client';
import { useState } from 'react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(()=>({}));
      alert(d.error || 'Login fehlgeschlagen');
      return;
    }
    window.location.reload();
  };

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h1 className="text-xl font-semibold">Admin Login</h1>
      <input
        type="password"
        placeholder="Admin Passwort"
        value={password}
        onChange={e=>setPassword(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? '...' : 'Einloggen'}
      </button>
    </form>
  );
}
