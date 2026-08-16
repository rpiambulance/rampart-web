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

export async function resolveConflict(formData: FormData) {
  const action = String(formData.get('action') ?? '');
  try {
    await api('/v1/admin/legacy-migration/resolve', {
      method: 'POST',
      body: JSON.stringify({
        conflictId: String(formData.get('conflictId') ?? ''),
        action,
        // Only meaningful for `replace`; blank clears a nullable field.
        value: action === 'replace' ? String(formData.get('value') ?? '') : undefined,
      }),
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
