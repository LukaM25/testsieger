import { randomUUID } from "crypto";

const ENV = process.env.APP_ENV ?? process.env.NODE_ENV ?? "dev";

function base(path: string) {
  return `${ENV}/${path}`;
}

// OFFICIAL CERTIFICATE PDF (versioned to avoid overwrites)
export function officialPdfKey(sealNumber: string) {
  return base(`official/REPORT_${sealNumber}_${randomUUID()}.pdf`);
}

// UPLOADED REPORT from company/user
export function uploadedPdfKey(sealNumber: string, originalExt = "pdf") {
  return base(`uploaded/REPORT_${sealNumber}_${randomUUID()}.${originalExt}`);
}

// QR CODE for certificate
export function qrKey(sealNumber: string) {
  return base(`qr/${sealNumber}.png`);
}

// Seal image
export function sealImageKey(id: string) {
  return base(`seals/${id}.png`);
}

// Generic product uploads
export function productUploadKey(userId: string, fileId: string, ext: string) {
  return base(`uploads/${userId}/${fileId}.${ext}`);
}
