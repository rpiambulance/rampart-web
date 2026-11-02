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

/**
 * What a certification type asks of whoever submits it.
 *
 * A driver's license needs its number and its expiry; a one-off class needs
 * neither, and a form that asks anyway teaches people to leave fields blank.
 */
export async function setCertificationFields(id: number, formData: FormData) {
  const field = (name: string) => String(formData.get(name) ?? 'OPTIONAL');
  try {
    await api(`/v1/certifications/types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        identifierField: field('identifierField'),
        issuedAtField: field('issuedAtField'),
        expiresAtField: field('expiresAtField'),
        documentField: field('documentField'),
      }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings/certifications');
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

/** The dates on a requirement that say when it applies and what counts. */
const REQUIREMENT_DATES = [
  'effectiveFrom',
  'effectiveUntil',
  'countsFrom',
  'validThrough',
] as const;

/**
 * A date input's value as the API takes it — a date-only value, which the
 * API reads as the New York calendar day — or undefined when left blank.
 */
function dateOnly(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? '').trim();
  return text ? `${text}T00:00:00.000Z` : undefined;
}

/**
 * Move a requirement between "checked at promotion" and "checked forever".
 *
 * Optionally excusing everybody it would catch today, which is what makes the
 * switch safe to throw on an agency whose records predate the rule.
 */
export async function setRequirementScope(
  requirementId: number,
  formData: FormData,
) {
  const scope = String(formData.get('scope') ?? '');
  try {
    await api(`/v1/credentials/requirements/${requirementId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        scope,
        // Every date is sent, blank as null, so clearing a field clears it.
        ...Object.fromEntries(
          REQUIREMENT_DATES.map((field) => [
            field,
            dateOnly(formData.get(field)) ?? null,
          ]),
        ),
      }),
    });
    if (formData.get('grandfather') === 'on') {
      await api(`/v1/credentials/requirements/${requirementId}/grandfather`, {
        method: 'POST',
      });
    }
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings/credentials');
}

/** Who the requirement would suspend once it applies, for the confirmation step. */
export async function requirementImpact(requirementId: number) {
  return api<{
    requirement: string;
    /** The day it is judged on: today, or the day it takes effect. */
    asOf: string;
    members: Array<{ id: number; name: string; reason: string }>;
  }>(`/v1/credentials/requirements/${requirementId}/impact`);
}

export async function addRequirement(
  credentialTypeId: number,
  formData: FormData,
) {
  const kind = String(formData.get('kind') ?? '');
  const group = String(formData.get('alternativeGroup') ?? '').trim();
  const scope = String(formData.get('scope') ?? 'PROMOTION');
  const body: Record<string, unknown> = {
    kind,
    scope,
    ...(group ? { alternativeGroup: group } : {}),
  };
  for (const field of REQUIREMENT_DATES) {
    const value = dateOnly(formData.get(field));
    if (value) body[field] = value;
  }
  if (kind === 'CERTIFICATION') {
    body.certificationTypeId = Number(formData.get('certificationTypeId'));
  } else if (kind === 'EVALUATION_COUNT') {
    body.evalTemplateId = Number(formData.get('evalTemplateId'));
    body.count = Number(formData.get('count'));
  } else if (kind === 'CHECKLIST') {
    // A checklist requirement is satisfied by every line being signed off, so
    // unlike an evaluation requirement it carries no count.
    body.evalTemplateId = Number(formData.get('evalTemplateId'));
  } else if (kind === 'CLASS') {
    // A series is any session of the class, this year's or next; one class
    // is that session only. The series wins if both were picked.
    const series = Number(formData.get('classSeriesId'));
    if (series) body.classSeriesId = series;
    else body.classId = Number(formData.get('classId'));
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

/**
 * Slack settings. A blank secret means "leave it as it is" — the form never
 * showed the stored one, so blank cannot mean "clear it" without making an
 * unrelated edit wipe the token.
 */
export async function saveSlackSettings(formData: FormData) {
  const channels: Record<string, string> = {};
  for (const [name, value] of formData.entries()) {
    if (name.startsWith('channel:')) {
      channels[name.slice('channel:'.length)] = String(value).trim();
    }
  }
  const botToken = String(formData.get('botToken') ?? '').trim();
  const signingSecret = String(formData.get('signingSecret') ?? '').trim();

  try {
    await api('/v1/settings/slack', {
      method: 'PUT',
      body: JSON.stringify({
        channels,
        ...(botToken ? { botToken } : {}),
        ...(signingSecret ? { signingSecret } : {}),
      }),
    });
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings');
}

/**
 * Applies the email matches an administrator confirmed.
 *
 * The pairs come back from the form rather than being recomputed, so what is
 * written is exactly what was shown — a member whose Slack address changed
 * between rendering and pressing cannot be linked to somebody else.
 */
export async function applySlackLinks(formData: FormData) {
  let pairs: Array<{ memberId: number; slackId: string }> = [];
  try {
    pairs = JSON.parse(String(formData.get('pairs') ?? '[]')) as typeof pairs;
  } catch {
    pairs = [];
  }
  if (!pairs.length) return;

  let result = { linked: 0, skipped: 0 };
  try {
    result = await api<{ linked: number; skipped: number }>(
      '/v1/settings/slack/links/apply',
      { method: 'POST', body: JSON.stringify({ pairs }) },
    );
  } catch (error) {
    fail(error);
  }
  revalidatePath('/admin/settings/messaging');
  redirect(
    `/admin/settings/messaging?matched=${encodeURIComponent(
      `${result.linked} account${result.linked === 1 ? '' : 's'}${
        result.skipped ? `, ${result.skipped} skipped` : ''
      }`,
    )}`,
  );
}
