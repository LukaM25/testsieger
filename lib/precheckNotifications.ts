import { AdminRole } from '@prisma/client';
import { sendPrecheckRegistrationAlert } from '@/lib/email';
import { prisma } from '@/lib/prisma';

type NotifySuperadminsOfPrecheckRegistrationInput = {
  productId: string;
  productName: string;
  brand: string;
  category?: string | null;
  code?: string | null;
  customerName: string;
  customerEmail: string;
  customerCompany?: string | null;
  sourceLabel: string;
};

function isValidEmail(value: string | undefined | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function parseSuperadminNotificationEmails(rawValue = '') {
  return rawValue
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(isValidEmail);
}

async function getSuperadminNotificationRecipients() {
  const admins = await prisma.admin.findMany({
    where: {
      role: AdminRole.SUPERADMIN,
      active: true,
      revokedAt: null,
    },
    select: { email: true },
  });

  const envRecipients = parseSuperadminNotificationEmails(
    process.env.SUPERADMIN_NOTIFICATION_EMAILS ?? process.env.SUPERADMIN_NOTIFICATION_EMAIL ?? '',
  );

  return Array.from(
    new Set(
      [...admins.map((admin) => admin.email.trim().toLowerCase()), ...envRecipients].filter(isValidEmail),
    ),
  );
}

export async function notifySuperadminsOfPrecheckRegistration(
  input: NotifySuperadminsOfPrecheckRegistrationInput,
) {
  const recipients = await getSuperadminNotificationRecipients();
  if (!recipients.length) {
    console.warn('PRECHECK_SUPERADMIN_NOTIFICATION_SKIPPED_NO_RECIPIENTS', {
      productId: input.productId,
    });
    return;
  }

  const results = await Promise.allSettled(
    recipients.map((to) =>
      sendPrecheckRegistrationAlert({
        to,
        ...input,
      }),
    ),
  );

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error('PRECHECK_SUPERADMIN_NOTIFICATION_FAILED', {
        productId: input.productId,
        recipient: recipients[index],
        error: result.reason,
      });
    }
  });
}
