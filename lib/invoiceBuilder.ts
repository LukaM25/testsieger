export type InvoiceLine = {
  label: string;
  amountCents: number;
};

type InvoiceOptions = {
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string | null;
  productName: string;
  lines: InvoiceLine[];
  currency?: string;
};

export async function generateInvoicePdf(opts: InvoiceOptions): Promise<Buffer> {
  const { invoiceNumber, customerName, customerEmail, customerAddress, productName, lines, currency = 'EUR' } = opts;
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const { width } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const totalCents = lines.reduce((sum, line) => sum + (line.amountCents || 0), 0);
  const formatMoney = (cents: number) => `${(cents / 100).toFixed(2)} ${currency}`;

  let y = 780;
  const left = 50;
  const right = width - 50;

  const drawText = (text: string, opts: { x?: number; y?: number; size?: number; color?: any; font?: any }) => {
    page.drawText(text, {
      x: opts.x ?? left,
      y: opts.y ?? y,
      size: opts.size ?? 11,
      font: opts.font ?? font,
      color: opts.color ?? rgb(0.07, 0.09, 0.15),
    });
  };

  // Header
  drawText('Rechnung / Invoice', { size: 18, font: fontBold });
  y -= 24;
  drawText(`Nr.: ${invoiceNumber}`, { size: 11, color: rgb(0.42, 0.45, 0.5) });
  y -= 14;
  drawText(`Datum: ${new Date().toLocaleDateString('de-DE')}`, { size: 11, color: rgb(0.42, 0.45, 0.5) });
  y -= 28;

  // Seller
  drawText('Prüfsiegel Zentrum UG (haftungsbeschränkt)', { size: 11, font: fontBold });
  y -= 14;
  ['Musterstraße 12', '6020 Innsbruck', 'Österreich'].forEach((line) => {
    drawText(line, { size: 11 });
    y -= 14;
  });
  y -= 10;

  // Customer
  drawText('Rechnung an / Bill to:', { size: 11, font: fontBold });
  y -= 14;
  drawText(customerName, { size: 12 });
  y -= 14;
  if (customerEmail) {
    drawText(customerEmail, { size: 11 });
    y -= 14;
  }
  if (customerAddress) {
    customerAddress.split('\n').forEach((line) => {
      drawText(line, { size: 11 });
      y -= 14;
    });
  }
  y -= 16;

  // Product context
  drawText(`Produkt / Service: ${productName}`, { size: 12, font: fontBold });
  y -= 20;

  // Table header
  drawText('Position', { size: 11, color: rgb(0.21, 0.23, 0.29) });
  drawText('Betrag', { size: 11, color: rgb(0.21, 0.23, 0.29), x: right - 120 });
  y -= 8;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.5,
    color: rgb(0.9, 0.91, 0.93),
  });
  y -= 16;

  // Lines
  lines.forEach((lineItem) => {
    drawText(lineItem.label, { size: 11 });
    drawText(formatMoney(lineItem.amountCents || 0), { size: 11, x: right - 120, font: fontBold });
    y -= 18;
  });

  y -= 10;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.5,
    color: rgb(0.9, 0.91, 0.93),
  });
  y -= 18;

  // Total
  drawText('Gesamt / Total', { size: 12, font: fontBold });
  drawText(formatMoney(totalCents), { size: 12, font: fontBold, x: right - 120 });
  y -= 24;

  drawText('Vielen Dank für Ihr Vertrauen!', { size: 10, color: rgb(0.42, 0.45, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
