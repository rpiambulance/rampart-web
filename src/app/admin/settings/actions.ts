'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { apiErrorMessage } from '@/lib/errors';

function fail(error: unknown): never {
  redirect(
    `/admin/settings?error=${encodeURIComponent(apiErrorMessage(error))}`,
  );
}

async function putSetting(key: string, value: unknown) {
  try {
    await api(`/v1/crews/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

// ---- scheduling knobs ----

export async function updateMinAgeYears(formData: FormData) {
  await putSetting('minAgeYears', Number(formData.get('value')));
}

export async function updateRiderSignupOpen(formData: FormData) {
  await putSetting('riderSignupOpen', {
    weekday: Number(formData.get('weekday')),
    time: String(formData.get('time') ?? ''),
  });
}

export async function updateRotationWeeks(formData: FormData) {
  await putSetting('rotationWeeks', Number(formData.get('value')));
}

export async function updateDayOfUnlockTime(formData: FormData) {
  await putSetting('dayOfUnlockTime', String(formData.get('value') ?? ''));
}

export async function updateProbationaryRequiresTrainer(formData: FormData) {
  await putSetting('probationaryRequiresTrainer', formData.get('value') === 'on');
}

export async function updateDropDeadline(formData: FormData) {
  await putSetting('dropDeadline', {
    daysBefore: Number(formData.get('daysBefore')),
    time: String(formData.get('time') ?? ''),
  });
}

// ---- certification types ----

export async function createCertificationType(formData: FormData) {
  const issuingOrg = String(formData.get('issuingOrg') ?? '').trim();
  const validity = String(formData.get('defaultValidityMonths') ?? '').trim();
  try {
    await api('/v1/certifications/types', {
      method: 'POST',
      body: JSON.stringify({
        name: String(formData.get('name') ?? '').trim(),
        abbreviation: String(formData.get('abbreviation') ?? '').trim(),
        ...(issuingOrg ? { issuingOrg } : {}),
        ...(validity ? { defaultValidityMonths: Number(validity) } : {}),
      }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

export async function deactivateCertificationType(id: number) {
  try {
    await api(`/v1/certifications/types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

// ---- event kinds ----

export async function createEventKind(formData: FormData) {
  try {
    await api('/v1/events/kinds', {
      method: 'POST',
      body: JSON.stringify({ name: String(formData.get('name') ?? '').trim() }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

export async function deactivateEventKind(id: number) {
  try {
    await api(`/v1/events/kinds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

// ---- credential requirements ----

export async function addRequirement(
  credentialTypeId: number,
  formData: FormData,
) {
  const kind = String(formData.get('kind') ?? '');
  const body: Record<string, unknown> = { kind };
  if (kind === 'CERTIFICATION') {
    body.certificationTypeId = Number(formData.get('certificationTypeId'));
  } else if (kind === 'EVALUATION_COUNT') {
    body.evalTemplateId = Number(formData.get('evalTemplateId'));
    body.count = Number(formData.get('count'));
  } else if (kind === 'CLASS') {
    body.classId = Number(formData.get('classId'));
  }
  try {
    await api(`/v1/credentials/types/${credentialTypeId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

export async function removeRequirement(requirementId: number) {
  try {
    await api(`/v1/credentials/requirements/${requirementId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

export async function setCredentialRoles(
  credentialTypeId: number,
  formData: FormData,
) {
  const roleIds = formData.getAll('roleIds').map(Number).filter(Number.isFinite);
  try {
    await api(`/v1/credentials/types/${credentialTypeId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roleIds }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      redirect(`/admin/settings?error=${encodeURIComponent(apiErrorMessage(error))}`);
    }
    throw error;
  }
  revalidatePath('/admin/settings');
}

export async function setCertificationSupersedes(
  higherTypeId: number,
  formData: FormData,
) {
  const lowerTypeIds = formData
    .getAll('lowerTypeIds')
    .map((value) => Number(value))
    .filter((id) => Number.isFinite(id));
  try {
    await api(`/v1/certifications/types/${higherTypeId}/supersedes`, {
      method: 'PUT',
      body: JSON.stringify({ lowerTypeIds }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

export async function saveCertificationLadder(formData: FormData) {
  const typeIds = formData
    .getAll('typeIds')
    .map((value) => Number(value))
    .filter((id) => Number.isFinite(id));
  const unlink = formData.get('unlink') === 'true';
  if (!typeIds.length) return;
  try {
    await api('/v1/certifications/ladder', {
      method: 'PUT',
      body: JSON.stringify({ typeIds, unlink }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

// ---- email ----

export async function saveEmailSettings(formData: FormData) {
  const pass = String(formData.get('pass') ?? '');
  const user = String(formData.get('user') ?? '').trim();
  try {
    await api('/v1/settings/email', {
      method: 'PUT',
      body: JSON.stringify({
        host: String(formData.get('host') ?? '').trim(),
        port: Number(formData.get('port')) || 587,
        secure: formData.get('secure') === 'on',
        ...(user ? { user } : {}),
        // Omitted entirely when left blank, which keeps the stored password.
        ...(pass ? { pass } : {}),
        from: String(formData.get('from') ?? '').trim(),
        ehloName: String(formData.get('ehloName') ?? '').trim(),
      }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

export async function sendTestEmail(formData: FormData) {
  const to = String(formData.get('to') ?? '').trim();
  let result: { ok: boolean; detail?: string; hint?: string };
  try {
    result = await api<{ ok: boolean; detail?: string; hint?: string }>(
      '/v1/settings/email/test',
      { method: 'POST', body: JSON.stringify({ to }) },
    );
  } catch (error) {
    fail(error);
    return;
  }
  // Carried back on the URL so the outcome survives the redirect.
  const params = new URLSearchParams({
    testTo: to,
    testOk: String(result.ok),
    ...(result.detail ? { testDetail: result.detail } : {}),
    ...(result.hint ? { testHint: result.hint } : {}),
  });
  redirect(`/admin/settings?${params}`);
}

export async function saveNotificationChannels(formData: FormData) {
  // Checkboxes only submit when ticked, so build from the names present.
  const channels: Record<string, { email: boolean; slack: boolean }> = {};
  const ensure = (key: string) =>
    (channels[key] ??= { email: false, slack: false });
  for (const [field] of formData.entries()) {
    const [channel, ...rest] = field.split(':');
    const key = rest.join(':');
    if (!key) continue;
    if (channel === 'email') ensure(key).email = true;
    else if (channel === 'slack') ensure(key).slack = true;
  }
  try {
    await api('/v1/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify({ channels }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}
