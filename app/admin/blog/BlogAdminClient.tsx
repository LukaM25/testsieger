'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import BlogContent from '@/components/blog/BlogContent';

type BlogAsset = {
  id: string;
  kind: 'COVER' | 'ATTACHMENT';
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; email: string };
  assets: BlogAsset[];
};

type EditorState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  seoTitle: string;
  seoDescription: string;
};

const emptyEditor: EditorState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'DRAFT',
  seoTitle: '',
  seoDescription: '',
};

function toEditor(post: BlogPost): EditorState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    content: post.content,
    status: post.status,
    seoTitle: post.seoTitle || '',
    seoDescription: post.seoDescription || '',
  };
}

function errorMessage(code?: string) {
  const messages: Record<string, string> = {
    TITLE_REQUIRED: 'Bitte geben Sie einen Titel ein.',
    CONTENT_REQUIRED_TO_PUBLISH: 'Zum Veröffentlichen wird ein Beitragstext benötigt.',
    FILE_TOO_LARGE: 'Die Datei ist größer als 20 MB.',
    COVER_MUST_BE_IMAGE: 'Als Titelbild sind JPG, PNG, WebP oder AVIF erlaubt.',
    ATTACHMENT_MUST_BE_PDF: 'Als Dokument kann nur eine PDF-Datei hochgeladen werden.',
    INVALID_FILE_CONTENT: 'Der Inhalt der Datei entspricht nicht dem angegebenen Dateityp.',
  };
  return (code && messages[code]) || 'Die Aktion konnte nicht abgeschlossen werden.';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export default function BlogAdminClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'COVER' | 'ATTACHMENT' | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const selectedPost = posts.find((post) => post.id === selectedId) || null;
  const cover = selectedPost?.assets.find((asset) => asset.kind === 'COVER') || null;
  const attachments = selectedPost?.assets.filter((asset) => asset.kind === 'ATTACHMENT') || [];

  async function loadPosts(preferredId?: string | null) {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/blog', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'LOAD_FAILED');
      const nextPosts = (data.posts || []) as BlogPost[];
      setPosts(nextPosts);
      const targetId = preferredId ?? selectedId;
      const target = nextPosts.find((post) => post.id === targetId);
      if (target) {
        setSelectedId(target.id);
        setEditor(toEditor(target));
      }
    } catch {
      setMessage({ tone: 'error', text: 'Die Blog Beiträge konnten nicht geladen werden.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts(null);
    // Initial fetch only; subsequent refreshes are triggered by explicit actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectPost(post: BlogPost) {
    setSelectedId(post.id);
    setEditor(toEditor(post));
    setMessage(null);
  }

  function startNewPost() {
    setSelectedId(null);
    setEditor(emptyEditor);
    setMessage(null);
  }

  function updateField<K extends keyof EditorState>(field: K, value: EditorState[K]) {
    setEditor((current) => ({ ...current, [field]: value }));
  }

  async function savePost(statusOverride?: 'DRAFT' | 'PUBLISHED') {
    setSaving(true);
    setMessage(null);
    const status = statusOverride ?? editor.status;
    try {
      const response = await fetch(selectedId ? `/api/admin/blog/${selectedId}` : '/api/admin/blog', {
        method: selectedId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editor, status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: 'error', text: errorMessage(data.error) });
        return null;
      }
      const saved = data.post as BlogPost;
      setSelectedId(saved.id);
      setEditor(toEditor(saved));
      setPosts((current) => {
        const withoutSaved = current.filter((post) => post.id !== saved.id);
        return [saved, ...withoutSaved];
      });
      setMessage({
        tone: 'success',
        text: status === 'PUBLISHED' ? 'Der Beitrag ist veröffentlicht.' : 'Der Entwurf wurde gespeichert.',
      });
      return saved;
    } catch {
      setMessage({ tone: 'error', text: 'Der Beitrag konnte nicht gespeichert werden.' });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    if (!selectedPost || !window.confirm(`„${selectedPost.title}“ wirklich dauerhaft löschen?`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/blog/${selectedPost.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('DELETE_FAILED');
      setPosts((current) => current.filter((post) => post.id !== selectedPost.id));
      startNewPost();
      setMessage({ tone: 'success', text: 'Der Beitrag wurde gelöscht.' });
    } catch {
      setMessage({ tone: 'error', text: 'Der Beitrag konnte nicht gelöscht werden.' });
    } finally {
      setSaving(false);
    }
  }

  async function uploadAsset(kind: 'COVER' | 'ATTACHMENT') {
    if (!selectedId) {
      setMessage({ tone: 'error', text: 'Speichern Sie den Entwurf zuerst, bevor Sie Dateien hochladen.' });
      return;
    }
    const input = kind === 'COVER' ? coverInputRef.current : attachmentInputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      setMessage({ tone: 'error', text: 'Bitte wählen Sie zuerst eine Datei aus.' });
      return;
    }

    setUploading(kind);
    setMessage(null);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('kind', kind);
      const response = await fetch(`/api/admin/blog/${selectedId}/assets`, { method: 'POST', body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: 'error', text: errorMessage(data.error) });
        return;
      }
      if (input) input.value = '';
      await loadPosts(selectedId);
      setMessage({ tone: 'success', text: kind === 'COVER' ? 'Das Titelbild wurde hochgeladen.' : 'Die PDF wurde hinzugefügt.' });
    } catch {
      setMessage({ tone: 'error', text: 'Die Datei konnte nicht hochgeladen werden.' });
    } finally {
      setUploading(null);
    }
  }

  async function removeAsset(asset: BlogAsset) {
    if (!selectedId || !window.confirm(`„${asset.fileName}“ wirklich entfernen?`)) return;
    setUploading(asset.kind);
    try {
      const response = await fetch(`/api/admin/blog/${selectedId}/assets/${asset.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('DELETE_FAILED');
      await loadPosts(selectedId);
      setMessage({ tone: 'success', text: 'Die Datei wurde entfernt.' });
    } catch {
      setMessage({ tone: 'error', text: 'Die Datei konnte nicht entfernt werden.' });
    } finally {
      setUploading(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green">Admin CMS</p>
              <h1 className="mt-2 text-3xl font-bold">Blog Beiträge verwalten</h1>
              <p className="mt-2 text-sm text-slate-600">Entwürfe schreiben, Dateien hochladen und Beiträge veröffentlichen.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                ← Admin Dashboard
              </Link>
              <button type="button" onClick={startNewPost} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                Neuer Beitrag
              </button>
            </div>
          </div>
        </header>

        {message && (
          <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${message.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
            {message.text}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px,minmax(0,1fr)]">
          <aside className="self-start rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
            <div className="flex items-center justify-between px-2 pb-3">
              <h2 className="font-semibold">Alle Beiträge</h2>
              <span className="text-xs text-slate-500">{posts.length}</span>
            </div>
            {loading ? (
              <p className="px-2 py-6 text-sm text-slate-500">Beiträge werden geladen…</p>
            ) : posts.length === 0 ? (
              <p className="px-2 py-6 text-sm text-slate-500">Noch keine Beiträge vorhanden.</p>
            ) : (
              <div className="max-h-[65vh] space-y-2 overflow-y-auto">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => selectPost(post)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${selectedId === post.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <span className="block line-clamp-2 text-sm font-semibold">{post.title}</span>
                    <span className={`mt-2 block text-xs ${selectedId === post.id ? 'text-slate-300' : post.status === 'PUBLISHED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {post.status === 'PUBLISHED' ? 'Veröffentlicht' : 'Entwurf'} · {formatDate(post.updatedAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="grid gap-5">
                <label className="grid gap-2 text-sm font-semibold">
                  Titel
                  <input
                    value={editor.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    maxLength={180}
                    placeholder="Titel des Blog Beitrags"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-base font-normal outline-none focus:border-slate-500"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  URL
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <span className="text-sm font-normal text-slate-500">/blog/</span>
                    <input
                      value={editor.slug}
                      onChange={(event) => updateField('slug', event.target.value)}
                      maxLength={100}
                      placeholder="wird-aus-dem-titel-erstellt"
                      className="min-w-0 flex-1 bg-transparent py-3 text-sm font-normal outline-none"
                    />
                  </div>
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Kurzbeschreibung
                  <textarea
                    value={editor.excerpt}
                    onChange={(event) => updateField('excerpt', event.target.value)}
                    maxLength={400}
                    rows={3}
                    placeholder="Kurze Zusammenfassung für die Blog-Übersicht"
                    className="resize-y rounded-xl border border-slate-200 px-4 py-3 font-normal leading-6 outline-none focus:border-slate-500"
                  />
                  <span className="text-right text-xs font-normal text-slate-400">{editor.excerpt.length}/400</span>
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Beitragstext
                  <textarea
                    value={editor.content}
                    onChange={(event) => updateField('content', event.target.value)}
                    maxLength={100000}
                    rows={18}
                    placeholder={'Einleitung des Beitrags…\n\n## Zwischenüberschrift\n\n- Erster Punkt\n- Zweiter Punkt'}
                    className="resize-y rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm font-normal leading-7 outline-none focus:border-slate-500"
                  />
                  <span className="text-xs font-normal leading-5 text-slate-500">
                    Formatierung: Leerzeile für neuen Absatz, <code>## Überschrift</code>, <code>### Unterüberschrift</code>, <code>- Listenpunkt</code> oder <code>1. Nummerierter Punkt</code>.
                  </span>
                </label>
              </div>

              <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">SEO-Einstellungen</summary>
                <div className="grid gap-4 border-t border-slate-200 p-4">
                  <label className="grid gap-2 text-sm font-semibold">
                    SEO-Titel
                    <input value={editor.seoTitle} onChange={(event) => updateField('seoTitle', event.target.value)} maxLength={180} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    SEO-Beschreibung
                    <textarea value={editor.seoDescription} onChange={(event) => updateField('seoDescription', event.target.value)} maxLength={320} rows={3} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal" />
                  </label>
                </div>
              </details>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
                <button type="button" disabled={saving} onClick={() => void savePost()} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
                  {saving ? 'Speichert…' : selectedPost?.status === 'PUBLISHED' ? 'Änderungen speichern' : 'Entwurf speichern'}
                </button>
                {editor.status === 'PUBLISHED' ? (
                  <button type="button" disabled={saving} onClick={() => void savePost('DRAFT')} className="rounded-xl bg-amber-100 px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-200 disabled:opacity-50">
                    Veröffentlichung zurückziehen
                  </button>
                ) : (
                  <button type="button" disabled={saving} onClick={() => void savePost('PUBLISHED')} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                    Jetzt veröffentlichen
                  </button>
                )}
                {selectedId && (
                  <Link href={`/admin/blog/preview/${selectedId}`} target="_blank" className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50">
                    Vorschau öffnen
                  </Link>
                )}
                {selectedPost && (
                  <button type="button" disabled={saving} onClick={() => void deletePost()} className="ml-auto rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                    Beitrag löschen
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Titelbild</h2>
                <p className="mt-1 text-sm text-slate-500">JPG, PNG, WebP oder AVIF · maximal 20 MB</p>
                {cover && (
                  <div className="mt-5">
                    <img src={`/api/blog/assets/${cover.id}`} alt="Aktuelles Titelbild" className="aspect-[16/9] w-full rounded-2xl border border-slate-200 object-cover" />
                    <button type="button" onClick={() => void removeAsset(cover)} className="mt-2 text-sm font-semibold text-rose-700 hover:underline">Titelbild entfernen</button>
                  </div>
                )}
                <div className="mt-5 flex flex-col gap-3">
                  <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full text-sm" disabled={!selectedId || uploading !== null} />
                  <button type="button" onClick={() => void uploadAsset('COVER')} disabled={!selectedId || uploading !== null} className="self-start rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {uploading === 'COVER' ? 'Lädt hoch…' : cover ? 'Titelbild ersetzen' : 'Titelbild hochladen'}
                  </button>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">PDF-Dokumente</h2>
                <p className="mt-1 text-sm text-slate-500">Mehrere PDFs möglich · jeweils maximal 20 MB</p>
                {attachments.length > 0 && (
                  <div className="mt-5 space-y-2">
                    {attachments.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                        <a href={`/api/blog/assets/${asset.id}`} className="min-w-0 break-words font-semibold hover:underline">{asset.fileName} <span className="font-normal text-slate-400">({formatBytes(asset.sizeBytes)})</span></a>
                        <button type="button" onClick={() => void removeAsset(asset)} className="shrink-0 font-semibold text-rose-700">Entfernen</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex flex-col gap-3">
                  <input ref={attachmentInputRef} type="file" accept="application/pdf" className="block w-full text-sm" disabled={!selectedId || uploading !== null} />
                  <button type="button" onClick={() => void uploadAsset('ATTACHMENT')} disabled={!selectedId || uploading !== null} className="self-start rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {uploading === 'ATTACHMENT' ? 'Lädt hoch…' : 'PDF hinzufügen'}
                  </button>
                </div>
              </section>
            </div>

            {(editor.title || editor.content) && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Schnellvorschau</p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight">{editor.title || 'Titel des Beitrags'}</h2>
                {editor.excerpt && <p className="mt-4 text-xl leading-8 text-slate-600">{editor.excerpt}</p>}
                <div className="mt-8 border-t border-slate-200 pt-8">
                  <BlogContent content={editor.content} />
                </div>
              </section>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
