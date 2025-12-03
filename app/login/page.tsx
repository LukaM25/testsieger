'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

        <div className="mb-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-500"
              aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="mb-4 text-right">
          <a href="/reset-password" className="text-sm text-blue-700 hover:underline">
            Passwort vergessen?
          </a>
        </div>
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
