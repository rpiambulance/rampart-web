'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/errors';

function eventsFrom(formData: FormData): string[] {
  return formData
    .getAll('events')
    .map(String)
    .filter(Boolean);
}

export async function createWebhook(formData: FormData) {
  let secret: string;
  try {
    const created = await api<{ secret: string }>('/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        name: String(formData.get('name') ?? '').trim(),
        url: String(formData.get('url') ?? '').trim(),
        events: eventsFrom(formData),
      }),
    });
    secret = created.secret;
  } catch (error) {
    redirect(
      `/admin/webhooks?error=${encodeURIComponent(apiErrorMessage(error))}`,
    );
  }
  revalidatePath('/admin/webhooks');
  // Shown once, on the way back: the API will not return it again.
  redirect(`/admin/webhooks?secret=${encodeURIComponent(secret)}`);
}

export async function updateWebhook(id: number, formData: FormData) {
  try {
    await api(`/v1/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: String(formData.get('name') ?? '').trim(),
        url: String(formData.get('url') ?? '').trim(),
        events: eventsFrom(formData),
        active: formData.get('active') === 'on',
      }),
    });
  } catch (error) {
    redirect(
      `/admin/webhooks?error=${encodeURIComponent(apiErrorMessage(error))}`,
    );
  }
  revalidatePath('/admin/webhooks');
}

export async function deleteWebhook(id: number) {
  try {
    await api(`/v1/webhooks/${id}`, { method: 'DELETE' });
  } catch (error) {
    redirect(
      `/admin/webhooks?error=${encodeURIComponent(apiErrorMessage(error))}`,
    );
  }
  revalidatePath('/admin/webhooks');
}
