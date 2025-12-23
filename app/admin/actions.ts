'use server';

import { revalidatePath } from 'next/cache';
import { AdminRole } from '@prisma/client';

import { requireAdmin } from '@/lib/admin';
import { completeProduct, CompletionError } from '@/lib/completion';

export async function complete(formData: FormData) {
  const admin = await requireAdmin(AdminRole.SUPERADMIN).catch(() => null);
  if (!admin) return;

  const productId = String(formData.get('productId') || '');
  if (!productId) return;

  try {
    await completeProduct(productId);
  } catch (err) {
    if (err instanceof CompletionError) {
      console.error('ADMIN_COMPLETE_ERROR', err.code, err.payload);
      return;
    }
    console.error('ADMIN_COMPLETE_ERROR', err);
    return;
  }

  // Refresh the admin page
  revalidatePath('/admin');
}
