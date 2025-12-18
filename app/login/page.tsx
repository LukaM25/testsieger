'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, redirectTo: next }),
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
          type="email"
          inputMode="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value.toLowerCase())}
          className="mb-3 w-full rounded-md border px-3 py-2"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
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
          Admin? Bitte nutzen Sie den separaten <a href="/admin" className="text-blue-700 underline">Admin Login</a>.
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
