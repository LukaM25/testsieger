'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (email.trim().toLowerCase() === 'admin') {
        const adminRes = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const adminData = await adminRes.json().catch(() => ({}));
        if (!adminRes.ok) {
          throw new Error(adminData.error || 'Admin Login fehlgeschlagen');
        }
        router.push('/admin');
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        router.push(data.redirect || '/dashboard');
        return;
      }
      throw new Error(data.error || 'Login fehlgeschlagen');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login fehlgeschlagen';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md"
      >
        <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

        <input
          type="text"
          inputMode="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-md border px-3 py-2"
        />

        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border px-3 py-2"
        />
        <p className="text-xs text-gray-500 mb-3">
          Admin? Tragen Sie im E-Mail-Feld exakt „Admin“ (Groß-/Kleinschreibung wird ignoriert) und Ihr Admin-Passwort ein.
        </p>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black py-2 text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? 'Wird geprüft…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
