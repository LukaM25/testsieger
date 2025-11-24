import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAndSendCertificate } from '@/emailService';

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'ProductId is missing' }, { status: 400 });
    }

    // 1. Find the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { certificate: true, user: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Ensure a Certificate Record exists
    let certId = product.certificate?.id;

    if (!certId) {
       console.log('Creating new certificate record...');
       const newCert = await prisma.certificate.create({
         data: {
           productId: product.id,
           status: 'PENDING',
           externalReferenceId: `GEN-${Date.now()}`,
           // FIX: Provide empty strings for required fields to satisfy Prisma
           pdfUrl: '', 
           qrUrl: '',  
         }
       });
       certId = newCert.id;
    }

    console.log(`🚀 Starting Internal Engine for Cert ID: ${certId}`);

    // 3. Trigger the 100x Engine
    await processAndSendCertificate(certId, product.user.email);

    return NextResponse.json({ success: true, message: 'Certificate sent via Internal Engine' });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}