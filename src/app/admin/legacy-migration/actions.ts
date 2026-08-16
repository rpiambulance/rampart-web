'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { apiErrorMessage } from '@/lib/errors';

export async function startMigration(formData: FormData) {
  const mysqlUrl = String(formData.get('mysqlUrl') ?? '').trim();
  try {
    await api('/v1/admin/legacy-migration', {
      method: 'POST',
      body: JSON.stringify({ mysqlUrl }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      redirect(
        `/admin/legacy-migration?error=${encodeURIComponent(apiErrorMessage(error))}`,
      );
    }
    throw error;
  }
  revalidatePath('/admin/legacy-migration');
}
