// lib/pdfmonkey.ts
// Minimal PDFMonkey client for server-side use in Next.js (App Router)

type PdfMonkeyDoc = {
  id: string;
  status: 'queued' | 'processing' | 'success' | 'failure';
  downloadUrl?: string | null;
};

const BASE = 'https://api.pdfmonkey.io/api/v1';

function getKey() {
  const key = process.env.PDFMONKEY_API_KEY;
  if (!key) throw new Error('Missing PDFMONKEY_API_KEY');
  return key;
}

function headers() {
  return {
    'Authorization': `Bearer ${getKey()}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.api+json',
  };
}

function unwrapDoc(json: any): PdfMonkeyDoc {
  // JSON:API style
  const data = json?.data;
  const attrs = data?.attributes ?? {};
  return {
    id: data?.id,
    status: (attrs.status || 'queued') as PdfMonkeyDoc['status'],
    downloadUrl: attrs.download_url ?? attrs.downloadUrl ?? null,
  };
}

/**
 * Create a PDF document on PDFMonkey using a template + payload.
 * Returns the new document (usually status=queued). Poll with getDocumentCard.
 */
export async function createPdfDocument(payload: Record<string, any>, templateId?: string): Promise<PdfMonkeyDoc> {
  const tpl = templateId ?? process.env.PDFMONKEY_TEMPLATE_ID;
  if (!tpl) throw new Error('Missing PDFMONKEY_TEMPLATE_ID');
  const body = {
    document: {
      template_id: tpl,
      payload,
      meta: {}, // optionally pass context
    },
  };
  const res = await fetch(`${BASE}/documents`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PDFMonkey create failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return unwrapDoc(json);
}

/**
 * Retrieve a document’s current status and (when ready) its download URL.
 */
export async function getDocumentCard(id: string): Promise<PdfMonkeyDoc> {
  if (!id) throw new Error('Missing document id');
  const res = await fetch(`${BASE}/documents/${id}`, {
    headers: headers(),
    // GET works; if your runtime requires, you can add next: { revalidate: 0 }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PDFMonkey get failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return unwrapDoc(json);
}
