'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [productId, setProductId] = useState('');
  const [file, setFile] = useState<File | null>(null);
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

  const upload = async () => {
    if (!file || !productId) { setMsg('Produkt-ID und PDF wählen'); return; }
    setBusy(true); setMsg(null);
    const fd = new FormData();
    fd.append('productId', productId);
    fd.append('report', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setBusy(false);
    if (res.ok && data?.verifyUrl) {
      setMsg(`OK: ${data.verifyUrl}`);
    } else {
      setMsg('Fehler beim Upload');
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
      <h1 className="mb-6 text-2xl font-semibold">Report hochladen & Zertifikat erzeugen</h1>

      <label className="block text-sm font-medium">Produkt-ID</label>
      <input
        value={productId}
        onChange={e=>setProductId(e.target.value)}
        placeholder="cuid..."
        className="mb-4 w-full rounded-lg border px-3 py-2"
      />

      <label className="block text-sm font-medium">Prüfbericht (PDF)</label>
      <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0] ?? null)} />

      <button
        onClick={upload}
        disabled={busy}
        className="mt-6 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {busy ? 'Wird verarbeitet…' : 'Hochladen & Zertifikat erzeugen'}
      </button>

      {msg && <p className="mt-4 text-sm">{msg}</p>}
    </div>
  );
}
