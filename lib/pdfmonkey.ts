export async function generateCertificate({
  product_name,
  brand_name,
  sku,
  seal_number,
  valid_to,
  report_url,
  qr_url
}: {
  product_name: string;
  brand_name: string;
  sku: string;
  seal_number: string;
  valid_to: string;
  report_url: string;
  qr_url: string;
}) {
  const apiKey = process.env.PDFMONKEY_API_KEY!;
  const templateId = process.env.PDFMONKEY_TEMPLATE_ID!;

  const res = await fetch("https://api.pdfmonkey.io/api/v1/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      document: {
        status: "pending",
        template_id: templateId,
        payload: {
          product_name,
          brand_name,
          sku,
          seal_number,
          valid_to,
          report_url,
          qr_url,
        },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`PDFMonkey error: ${data.error || res.statusText}`);
  return data;
}
