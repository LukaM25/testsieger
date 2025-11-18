
import { NextResponse } from "next/server";
import { createPdfDocument, getDocumentCard } from "@/lib/pdfmonkey";

export async function POST(req: Request) {
  const { payload, templateId } = await req.json();
  const doc = await createPdfDocument(payload, templateId);
  const start = Date.now();
  while (Date.now() - start < 20000) {
    const c = await getDocumentCard(doc.id);
    if (c.status === 'success' && c.downloadUrl) return NextResponse.json({ url: c.downloadUrl });
    await new Promise(r => setTimeout(r, 1000));
  }
  return NextResponse.json({ error: 'timeout' }, { status: 504 });
}
