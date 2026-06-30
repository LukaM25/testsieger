// app/api/precheck/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendPrecheckClaimEmail } from '@/lib/email';
import { hasAnalyticsConsent, recordAnalyticsEvent } from '@/lib/analytics';
import { createPrecheckInvite } from '@/lib/precheckInvite';

const PrecheckSchema = z.object({
  email: z.string().trim().email(),
  // product
  productName: z.string().trim().min(2),
  brand: z.string().trim().min(1),
  category: z.string().trim().min(1),
  code: z.string().trim().min(2),
  specs: z.string().trim().min(5),
  privacyAccepted: z.literal(true),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = PrecheckSchema.parse(json);
    const category = data.category.trim();
    const normalizedEmail = data.email.trim().toLowerCase();

    const productData = {
      productName: data.productName,
      brand: data.brand,
      category,
      code: data.code,
      specs: data.specs,
    };

    const { token } = await createPrecheckInvite({
      email: normalizedEmail,
      contactName: '',
      productData,
      privacyAccepted: data.privacyAccepted,
    });
    const claimUrl = `${new URL(req.url).origin}/precheck/claim?token=${encodeURIComponent(token)}`;

    void sendPrecheckClaimEmail({
      to: normalizedEmail,
      name: '',
      productName: data.productName,
      claimToken: token,
      claimUrl,
    }).catch((error) => {
      console.error('PRECHECK_CLAIM_EMAIL_FAILED', { email: normalizedEmail, error });
    });

    if (hasAnalyticsConsent(req)) {
      void recordAnalyticsEvent({
        name: 'precheck_invite_submit',
        path: '/precheck',
        metadata: {
          category,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      pending: true,
      message: 'Bitte prüfen Sie Ihre E-Mail, um das Konto zu erstellen und den Pre-Check fortzusetzen.',
      claimUrl: process.env.NODE_ENV === 'production' ? undefined : claimUrl,
    });
  } catch (err: any) {
    console.error(err);
    if (err?.issues) {
      return NextResponse.json({ ok: false, errors: err.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'Precheck failed' }, { status: 500 });
  }
}
