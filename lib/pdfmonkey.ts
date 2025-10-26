
export const PDFMONKEY_API = "https://api.pdfmonkey.io/api/v1";
export async function createPdfDocument(payload: any, filename: string) {
  const res = await fetch(`${PDFMONKEY_API}/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PDFMONKEY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      document: {
        document_template_id: process.env.PDFMONKEY_TEMPLATE_ID,
        status: "pending",
        payload,
        meta: { _filename: filename }
      }
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const { document } = await res.json();
  return document as { id: string };
}

export async function getDocumentCard(id: string) {
  const res = await fetch(`${PDFMONKEY_API}/document_cards/${id}`, {
    headers: { Authorization: `Bearer ${process.env.PDFMONKEY_API_KEY}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
