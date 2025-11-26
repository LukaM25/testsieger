import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode'; // <--- NEW IMPORT
import { generateCertificatePdf } from './pdfGenerator'; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER;

export async function processAndSendCertificate(certificateId, userEmail) {
  console.log(`Processing certificate: ${certificateId}`);
  const client = await pool.connect();
  
  try {
    // 1. Fetch Data
    const { rows } = await client.query(
      `
        SELECT 
          c.id AS certificate_id,
          c."externalReferenceId",
          c."seal_number",
          c.status,
          c."createdAt" as cert_created_at,
          p.id AS product_id,
          p.name,
          p.brand,
          p.category,
          p.code,
          p.specs,
          p.size,
          p."madeIn",
          p.material,
          u.name AS user_name,
          u.company,
          u.email,
          u.address
        FROM "Certificate" c
        JOIN "Product" p ON c."productId" = p.id
        JOIN "User" u ON p."userId" = u.id
        WHERE c.id = $1
      `,
      [certificateId]
    );

    if (rows.length === 0) {
      throw new Error(`Certificate record not found for ID: ${certificateId}`);
    }

    const record = rows[0];

    // 2. Generate QR Code Image (Base64)
const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/lizenzen?q=${record.product_id}`;
    const qrImageData = await QRCode.toDataURL(verificationLink);

    // 3. Prepare Context
    const dataContext = {
      id: record.certificate_id,
      name: record.name,
      brand: record.brand,
      category: record.category,
      code: record.code,
      specs: record.specs,
      size: record.size,
      madeIn: record.madeIn,
      material: record.material,
      createdAt: record.cert_created_at,
      status: record.status,
      seal_number: record.seal_number,
      externalReferenceId: record.externalReferenceId,
      user: {
        name: record.user_name,
        company: record.company,
        email: record.email,
        address: record.address
      },
      qrUrl: qrImageData, // <--- Passing the IMAGE DATA now
      verify_url: verificationLink // Passing the text link separately
    };

    // 4. Generate PDF
    console.log('Generating PDF Buffer...');
    const pdfBuffer = await generateCertificatePdf(dataContext);

    // 5. Send Email
    console.log(`Sending email to ${userEmail}...`);
    await transporter.sendMail({
      from: `Pruefsiegel Zentrum UG – Certificate <${MAIL_FROM}>`,
      to: userEmail,
      subject: `Your Product Certificate: ${record.name}`,
      html: `
        <p>Dear ${record.user_name},</p>
        <p>Your product <strong>${record.name}</strong> has been successfully verified.</p>
        <p>Please find your official certificate attached.</p>
      `,
      attachments: [
        {
          filename: `Certificate_${record.brand}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    // 6. Update Database
    await client.query(
      `UPDATE "Certificate" SET status = 'ISSUED', "lastSentAt" = NOW() WHERE id = $1`,
      [certificateId]
    );

    return { success: true };
  } catch (error) {
    console.error('Email Service Error:', error);
    throw error;
  } finally {
    client.release();
  }
}
