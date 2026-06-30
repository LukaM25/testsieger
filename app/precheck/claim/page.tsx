'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

type ClaimInfo = {
  email: string;
  contactName: string;
  productName: string;
  brand: string;
  expiresAt: string;
};

type ClaimState =
  | { status: 'loading' }
  | { status: 'invalid' }
  | {
      status: 'ready';
      invite: ClaimInfo;
      existingAccount: boolean;
      canClaimWithSession: boolean;
      sessionEmail: string | null;
    };

export default function PrecheckClaimPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') || '';
  const [state, setState] = useState<ClaimState>({ status: 'loading' });
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setState({ status: 'invalid' });
        return;
      }
      const res = await fetch(`/api/precheck/claim?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok || !data?.ok) {
        setState({ status: 'invalid' });
        return;
      }
      setState({
        status: 'ready',
        invite: data.invite,
        existingAccount: Boolean(data.existingAccount),
        canClaimWithSession: Boolean(data.canClaimWithSession),
        sessionEmail: data.sessionEmail ?? null,
      });
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const claim = async (withPassword: boolean) => {
    setError(null);
    if (withPassword) {
      if (name.trim().length < 2) {
        setError('Bitte geben Sie Ihren Namen ein.');
        return;
      }
      if (password.length < 8) {
        setError('Passwort muss mindestens 8 Zeichen lang sein.');
        return;
      }
      if (password !== confirm) {
        setError('Passwörter stimmen nicht überein.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/precheck/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: withPassword ? name : undefined, password: withPassword ? password : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data?.redirect) {
        router.push(data.redirect);
        return;
      }
      if (!res.ok || !data?.ok) {
        const message =
          data?.error === 'WEAK_PASSWORD'
            ? 'Passwort muss mindestens 8 Zeichen lang sein.'
            : data?.error === 'MISSING_NAME'
              ? 'Bitte geben Sie Ihren Namen ein.'
            : data?.error === 'INVALID_OR_EXPIRED'
              ? 'Dieser Link ist ungültig oder abgelaufen.'
              : 'Der Pre-Check konnte nicht übernommen werden.';
        setError(message);
        return;
      }
      router.push(data.redirect || '/precheck');
    } catch {
      setError('Der Pre-Check konnte nicht übernommen werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {state.status === 'loading' && (
          <p className="text-sm text-slate-600">Link wird geprüft...</p>
        )}

        {state.status === 'invalid' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Link ungültig oder abgelaufen</h1>
            <p className="text-sm text-slate-600">
              Bitte reichen Sie Ihr Produkt erneut ein oder kontaktieren Sie uns, wenn Sie Unterstützung benötigen.
            </p>
            <Link href="/produkte/produkt-test?precheck=open#precheck" className="inline-flex rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">
              Zum Pre-Check
            </Link>
          </div>
        )}

        {state.status === 'ready' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pre-Check fortsetzen</p>
              <h1 className="mt-2 text-2xl font-semibold">Konto erstellen und Produkt übernehmen</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Produkt: <strong>{state.invite.productName}</strong>
                <br />
                Marke: {state.invite.brand}
                <br />
                E-Mail: {state.invite.email}
              </p>
            </div>

            {state.existingAccount && !state.canClaimWithSession && (
              <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p>Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte melden Sie sich an, danach wird dieses Produkt übernommen.</p>
                <Link
                  href={`/login?email=${encodeURIComponent(state.invite.email)}&next=${encodeURIComponent(`/precheck/claim?token=${token}`)}`}
                  className="inline-flex rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
                >
                  Einloggen und fortfahren
                </Link>
              </div>
            )}

            {state.existingAccount && state.canClaimWithSession && (
              <button
                type="button"
                onClick={() => claim(false)}
                disabled={loading}
                className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
              >
                {loading ? 'Wird übernommen...' : 'Produkt übernehmen'}
              </button>
            )}

            {!state.existingAccount && (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  claim(true);
                }}
              >
                <div>
                  <label className="text-sm font-medium text-slate-800">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    autoComplete="name"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">Passwort</label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={8}
                      required
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-500"
                      aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">Passwort wiederholen</label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      minLength={8}
                      required
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((value) => !value)}
                      className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-500"
                      aria-label={showConfirm ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                >
                  {loading ? 'Konto wird erstellt...' : 'Konto erstellen und fortfahren'}
                </button>
              </form>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </section>
    </main>
  );
}
