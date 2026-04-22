import { sendPrecheckRegistrationAlert } from '@/lib/email';

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

async function getSuperadminNotificationRecipients() {
  return ['info@dpi-siegel.de'];
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
