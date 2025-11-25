import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type InvoiceInput = {
  customerName: string;
  customerEmail: string;
  address?: string | null;
  productName: string;
  amountCents: number;
  currency?: string;
  invoiceNumber: string;
};

export async function generateInvoicePdf(input: InvoiceInput): Promise<Buffer> {
  const { customerName, customerEmail, address, productName, amountCents, currency = 'EUR', invoiceNumber } = input;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const amount = (amountCents / 100).toFixed(2);

  const drawText = (text: string, x: number, y: number, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x, y, size, font, color });
  };

  let y = 800;
  drawText('Rechnung / Invoice', 380, y, 18);
  y -= 24;
  drawText(`Rechnungsnummer: ${invoiceNumber}`, 50, y);
  y -= 16;
  drawText(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 50, y);
  y -= 32;

  drawText('Rechnung an:', 50, y);
  y -= 16;
  drawText(customerName || 'Kunde', 50, y);
  y -= 14;
  if (address) {
    address.split('\n').forEach((line) => {
      drawText(line.trim(), 50, y);
      y -= 14;
    });
  }
  drawText(customerEmail, 50, y);
  y -= 28;

  drawText('Positionen', 50, y, 14);
  y -= 18;
  drawText(`${productName} x1`, 60, y);
  y -= 16;

  drawText(`Zwischensumme: ${amount} ${currency}`, 50, y);
  y -= 16;
  drawText(`Gesamt: ${amount} ${currency}`, 50, y);
  y -= 28;

  drawText('Vielen Dank für Ihre Bestellung.', 50, y, 10, rgb(0.2, 0.2, 0.2));

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
