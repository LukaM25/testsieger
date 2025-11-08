'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [productId, setProductId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const login = async () => {
    setMsg(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthed(true);
    else setMsg('Falsches Admin-Passwort');
  };

  const call = async (path: string) => {
    if (!productId) { setMsg('Produkt-ID eingeben'); return; }
    setBusy(true); setMsg(null);
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg(data.message || JSON.stringify(data));
    } else {
      setMsg(`Fehler: ${data?.error || res.status}`);
    }
  };

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Admin Login</h1>
        <input
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          placeholder="Admin-Passwort"
          className="w-full rounded-lg border px-3 py-2"
        />
        <button onClick={login} className="mt-4 rounded-lg bg-black px-4 py-2 text-white">
          Login
        </button>
        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Prüfung verwalten</h1>

      <label className="block text-sm font-medium">Produkt-ID</label>
      <input
        value={productId}
        onChange={e=>setProductId(e.target.value)}
        placeholder="cuid..."
        className="mb-6 w-full rounded-lg border px-3 py-2"
      />

      <div className="flex gap-3">
        <button
          onClick={() => call('/api/admin/receive')}
          disabled={busy}
          className="rounded-lg border px-4 py-2 disabled:opacity-60"
        >
          {busy ? 'Bitte warten…' : 'Eingang bestätigen (IN_REVIEW)'}
        </button>
        <button
          onClick={() => call('/api/admin/complete')}
          disabled={busy}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {busy ? 'Generiere PDF…' : 'Abschließen & Zertifikat erzeugen'}
        </button>
      </div>

      {msg && <p className="mt-4 text-sm">{msg}</p>}
    </div>
  );
}
