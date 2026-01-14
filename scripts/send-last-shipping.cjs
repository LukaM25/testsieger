#!/usr/bin/env node
// Sends the precheck payment/shipping email for the most recently created product.

const { readFileSync } = require('fs');
const { PrismaClient, Prisma } = require('@prisma/client');
const nodemailer = require('nodemailer');

function loadEnv(path) {
  try {
    const content = readFileSync(path, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const raw = line.slice(eq + 1).trim();
      const val = raw.replace(/^"/, '').replace(/"$/, '');
      if (key) process.env[key] = val;
    }
  } catch {
    // ignore missing
  }
}

loadEnv('.env.local');
loadEnv('.env');

const prisma = new PrismaClient();

function buildProcessNumber() {
  const digits = Math.floor(1000 + Math.random() * 9000); // TC-2xxxx
  return `TC-2${digits}`;
}

async function ensureProcessNumber(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { processNumber: true },
  });
  if (product?.processNumber) return product.processNumber;

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = buildProcessNumber();
    try {
      const updated = await prisma.product.update({
        where: { id: productId },
        data: { processNumber: candidate },
        select: { processNumber: true },
      });
      return updated.processNumber;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        continue; // collision, retry
      }
      throw err;
    }
  }
  throw new Error('PROCESS_NUMBER_ASSIGN_FAILED');
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) {
    throw new Error('Missing SMTP configuration');
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function renderFooter(baseUrl) {
  const base = (baseUrl || '').replace(/\/$/, '');
  const logo = `${base}/tclogo.png`;
  const seal = `${base}/siegel19.png`;
  return `
    <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;display:flex;align-items:center;gap:16px;color:#475569;font-size:12px;">
      <img src="${logo}" alt="DPI Logo" width="140" height="40" style="display:block;object-fit:contain;" />
      <img src="${seal}" alt="Prüfsiegel" width="70" height="70" style="display:block;object-fit:contain;" />
      <div style="line-height:1.4;">
        Deutsches Prüfsiegel Institut (DPI)<br/>
        Prüfzentrum – Kundenservice<br/>
        <a href="${base}" style="color:#1d4ed8;text-decoration:none;">${base}</a>
      </div>
    </div>
  `;
}

async function sendEmail({ to, name, productName, processNumber }) {
  const transporter = createTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'pruefsiegel@lucidstar.de';
  const appBase = process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://pruefsiegelzentrum.vercel.app';

  const html = `
    <div style="font-family:system-ui,Arial;line-height:1.65;color:#0f172a">
      <p>Guten Tag ${name || ''},</p>
      <p>vielen Dank für die Begleichung der Prüfgebühr. Ihr Auftrag für den Testsieger Check des Deutschen Prüfsiegel Instituts (DPI) ist damit offiziell aktiviert.</p>
      <p>Die Rechnung zu Ihrer Zahlung finden Sie im Anhang dieser E-Mail.</p>
      <p>Damit wir Ihr Produkt unmittelbar in den Prüfprozess übernehmen können, senden Sie es bitte an folgende Versandadresse:</p>
      <p style="margin:12px 0;line-height:1.5;font-size:14px;">
        Deutsches Prüfsiegel Institut (DPI)<br/>
        Abteilung Produktprüfung<br/>
        Tölzer Straße 172<br/>
        83703 Gmund<br/>
        Adresszusatz: Vorgangsnummer ${processNumber} (Betreff)
      </p>
      <p>Die Vorgangsnummer ist zwingend erforderlich, damit Ihr Produkt korrekt zugeordnet werden kann.</p>
      <p>Sobald das Produkt bei uns eingeht, erhalten Sie die Eingangsbestätigung sowie das geplante Prüfzeitfenster. Bei Fragen stehen wir jederzeit zur Verfügung.</p>
      <p style="margin-top:18px;">Mit besten Grüßen<br/>Deutsches Prüfsiegel Institut (DPI)</p>
      ${renderFooter(appBase)}
    </div>
  `;

  await transporter.sendMail({
    from: `Pruefsiegel Zentrum UG – Zahlung <${from}>`,
    to,
    subject: `Prüfgebühr bestätigt – Vorgangsnummer ${processNumber}`,
    html,
  });
}

(async () => {
  const product = await prisma.product.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });
  if (!product || !product.user) {
    console.log('No product with user found. Aborting.');
    return;
  }
  const processNumber = await ensureProcessNumber(product.id);
  await sendEmail({
    to: product.user.email,
    name: product.user.name,
    productName: product.name,
    processNumber,
  });
  console.log(`Sent shipping info email to ${product.user.email} with Vorgangsnummer ${processNumber}`);
})()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
