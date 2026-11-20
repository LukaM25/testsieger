'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BadgeCheck, Eye, EyeOff, FileCheck2, LayoutDashboard, ShieldCheck, Wallet } from 'lucide-react';

type Mode = 'login' | 'register';

const BENEFITS = [
  { Icon: LayoutDashboard, title: 'Alles in einem Dashboard', body: 'Produkte, Prüfstatus und Berichte an einem Ort.' },
  { Icon: FileCheck2, title: 'Berichte & Zertifikate', body: 'Transparente Prüfberichte jederzeit abrufbar.' },
  { Icon: BadgeCheck, title: 'Siegel & Lizenzen', body: 'Lizenzen und Rechnungen einfach verwalten.' },
  { Icon: Wallet, title: 'Zahlung erst nach Bestehen', body: 'Der Pre-Check ist kostenlos und unverbindlich.' },
];

const LOGIN_ERRORS: Record<string, string> = {
  USER_NOT_FOUND: 'E-Mail oder Passwort ist falsch.',
  INVALID_PASSWORD: 'E-Mail oder Passwort ist falsch.',
  MISSING_CREDENTIALS: 'Bitte E-Mail und Passwort eingeben.',
};

const field =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100';
const label = 'mb-1 block text-xs font-medium text-slate-600';

function passwordStrength(pw: string): { score: number; text: string } {
  if (!pw) return { score: 0, text: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const text = ['Zu kurz', 'Schwach', 'Okay', 'Gut', 'Sehr stark'][pw.length < 8 ? 0 : Math.max(1, score)];
  return { score: pw.length < 8 ? 0 : Math.max(1, score), text };
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState((searchParams.get('email') || '').toLowerCase());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reg, setReg] = useState({
    gender: '',
    firstName: '',
    lastName: '',
    company: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    confirmPassword: '',
    accepted: false,
  });
  const setRegField = (key: keyof typeof reg, value: string | boolean) => setReg((prev) => ({ ...prev, [key]: value }));
  const isRegister = mode === 'register';
  const strength = useMemo(() => passwordStrength(password), [password]);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (!reg.firstName.trim() || !reg.lastName.trim()) return setError('Bitte geben Sie Vor- und Nachnamen an.');
      if (password.length < 8) return setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      if (password !== reg.confirmPassword) return setError('Die Passwörter stimmen nicht überein.');
      if (!reg.accepted) return setError('Bitte akzeptieren Sie AGB und Datenschutzerklärung.');
      setLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: reg.firstName,
            lastName: reg.lastName,
            email: email.trim(),
            password,
            gender: reg.gender || null,
            company: reg.company.trim() || null,
            street: reg.street.trim() || null,
            houseNumber: reg.houseNumber.trim() || null,
            postalCode: reg.postalCode.trim() || null,
            city: reg.city.trim() || null,
            redirectTo: next,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          router.push(data.redirect || '/dashboard');
          return;
        }
        throw new Error(data.error || 'Registrierung fehlgeschlagen');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen');
      } finally {
        setLoading(false);
      }
      return;
    }

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }

  const passwordInput = (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={isRegister ? 'Mindestens 8 Zeichen' : 'Passwort'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`${field} pr-12`}
        autoComplete={isRegister ? 'new-password' : 'current-password'}
        required={isRegister}
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-400 transition hover:text-slate-600"
        aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-sky-50/60 px-4 py-10 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_40px_90px_-45px_rgba(43,64,102,0.45)] lg:grid-cols-[0.9fr,1.1fr]">
        {/* Linke Seite: Nutzen */}
        <aside className="relative hidden flex-col justify-between bg-gradient-to-b from-[#16294d] to-[#0b1730] p-10 text-white lg:flex">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/10 blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Kundenkonto
            </span>
            <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight">
              {isRegister ? 'Ihr Prüfsiegel. Ein Dashboard.' : 'Willkommen zurück.'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {isRegister
                ? 'Erstellen Sie Ihr Konto in zwei Minuten und behalten Sie Produkte, Prüfungen und Lizenzen im Blick.'
                : 'Melden Sie sich an und sehen Sie den aktuellen Stand Ihrer Produkte und Lizenzen.'}
            </p>
          </div>
          <ul className="relative mt-10 space-y-5">
            {BENEFITS.map(({ Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Icon className="h-5 w-5 text-sky-200" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-[13px] text-white/65">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Rechte Seite: Formular */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-10" noValidate={false}>
          {/* Umschalter */}
          <div role="tablist" aria-label="Anmelden oder Konto erstellen" className="relative grid grid-cols-2 rounded-full bg-slate-100 p-1">
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${
                isRegister ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`relative z-10 rounded-full py-2 text-sm font-semibold transition-colors ${
                  mode === m ? 'text-[#2B4066]' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'login' ? 'Anmelden' : 'Konto erstellen'}
              </button>
            ))}
          </div>

          <h1 className="mt-7 text-2xl font-semibold tracking-tight text-[#2B4066]">
            {isRegister ? 'Konto erstellen' : 'Anmelden'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRegister
              ? 'Kostenlos. Ihre Daten nutzen wir für Prüfung, Rechnung und Siegel.'
              : 'Zugang zu Ihrem Dashboard.'}
          </p>

          <div key={mode} className="mt-6 space-y-4 animate-[fadeIn_0.35s_ease-out]">
            {isRegister && (
              <>
                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-6 sm:col-span-2">
                    <label className={label} htmlFor="reg-gender">Anrede</label>
                    <select
                      id="reg-gender"
                      value={reg.gender}
                      onChange={(e) => setRegField('gender', e.target.value)}
                      className={field}
                    >
                      <option value="">Keine Angabe</option>
                      <option value="FEMALE">Frau</option>
                      <option value="MALE">Herr</option>
                      <option value="OTHER">Divers</option>
                    </select>
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <label className={label} htmlFor="reg-first">Vorname *</label>
                    <input
                      id="reg-first"
                      type="text"
                      value={reg.firstName}
                      onChange={(e) => setRegField('firstName', e.target.value)}
                      className={field}
                      autoComplete="given-name"
                      required
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <label className={label} htmlFor="reg-last">Nachname *</label>
                    <input
                      id="reg-last"
                      type="text"
                      value={reg.lastName}
                      onChange={(e) => setRegField('lastName', e.target.value)}
                      className={field}
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={label} htmlFor="reg-company">Firma (optional)</label>
                  <input
                    id="reg-company"
                    type="text"
                    value={reg.company}
                    onChange={(e) => setRegField('company', e.target.value)}
                    className={field}
                    autoComplete="organization"
                  />
                </div>
              </>
            )}

            <div>
              <label className={label} htmlFor="auth-email">E-Mail{isRegister ? ' *' : ''}</label>
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className={field}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required={isRegister}
              />
            </div>

            {isRegister && (
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-4">
                  <label className={label} htmlFor="reg-street">Straße</label>
                  <input
                    id="reg-street"
                    type="text"
                    value={reg.street}
                    onChange={(e) => setRegField('street', e.target.value)}
                    className={field}
                    autoComplete="address-line1"
                  />
                </div>
                <div className="col-span-2">
                  <label className={label} htmlFor="reg-nr">Nr.</label>
                  <input
                    id="reg-nr"
                    type="text"
                    value={reg.houseNumber}
                    onChange={(e) => setRegField('houseNumber', e.target.value)}
                    className={field}
                  />
                </div>
                <div className="col-span-2">
                  <label className={label} htmlFor="reg-plz">PLZ</label>
                  <input
                    id="reg-plz"
                    type="text"
                    inputMode="numeric"
                    value={reg.postalCode}
                    onChange={(e) => setRegField('postalCode', e.target.value)}
                    className={field}
                    autoComplete="postal-code"
                  />
                </div>
                <div className="col-span-4">
                  <label className={label} htmlFor="reg-city">Ort</label>
                  <input
                    id="reg-city"
                    type="text"
                    value={reg.city}
                    onChange={(e) => setRegField('city', e.target.value)}
                    className={field}
                    autoComplete="address-level2"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <label className={label} htmlFor="auth-password">Passwort{isRegister ? ' *' : ''}</label>
                {!isRegister && (
                  <a href="/reset-password" className="mb-1 text-xs font-medium text-sky-700 hover:underline">
                    Passwort vergessen?
                  </a>
                )}
              </div>
              {passwordInput}
              {isRegister && password && (
                <div className="mt-2 flex items-center gap-2" aria-live="polite">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          strength.score >= i
                            ? strength.score <= 1
                              ? 'bg-rose-400'
                              : strength.score === 2
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500">{strength.text}</span>
                </div>
              )}
            </div>

            {isRegister && (
              <>
                <div>
                  <label className={label} htmlFor="reg-confirm">Passwort wiederholen *</label>
                  <input
                    id="reg-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={reg.confirmPassword}
                    onChange={(e) => setRegField('confirmPassword', e.target.value)}
                    className={field}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <label className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
                  <input
                    type="checkbox"
                    checked={reg.accepted}
                    onChange={(e) => setRegField('accepted', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#1d4ed8]"
                  />
                  <span>
                    Ich akzeptiere die{' '}
                    <a href="/agb" target="_blank" className="font-medium text-sky-700 underline">AGB</a> und habe die{' '}
                    <a href="/datenschutz" target="_blank" className="font-medium text-sky-700 underline">Datenschutzerklärung</a> gelesen.
                  </span>
                </label>
              </>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {LOGIN_ERRORS[error] || error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-6 py-3 text-sm font-semibold !text-white shadow-[0_14px_28px_-16px_rgba(29,78,216,0.7)] transition duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? (isRegister ? 'Konto wird erstellt…' : 'Wird geprüft…') : isRegister ? 'Konto erstellen' : 'Anmelden'}
            {!loading && <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />}
          </button>

          <p className="mt-5 text-center text-sm text-slate-600">
            {isRegister ? 'Schon ein Konto?' : 'Noch kein Konto?'}{' '}
            <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')} className="font-semibold text-sky-700 hover:underline">
              {isRegister ? 'Jetzt anmelden' : 'Jetzt kostenlos erstellen'}
            </button>
          </p>
          {!isRegister && (
            <p className="mt-3 text-center text-xs text-slate-400">
              Admin? Bitte nutzen Sie den separaten <a href="/admin" className="text-sky-700 underline">Admin Login</a>.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
