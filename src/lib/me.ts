import { api } from './api';

/**
 * True when this member has asked for a 12-hour clock in their profile. The
 * console shows 24-hour time by default, and stays on it if the preference
 * cannot be read.
 */
export async function prefers12Hour(): Promise<boolean> {
  try {
    const me = await api<{ timeFormat?: string }>('/v1/members/me');
    return me.timeFormat === '12h';
  } catch {
    return false;
  }
}

/**
 * The signed-in member's effective permissions, for deciding what is worth
 * rendering. Enforcement is always the API's job.
 */
export async function myPermissions(): Promise<Set<string>> {
  try {
    const me = await api<{ permissions?: string[] }>('/v1/members/me');
    return new Set(me.permissions ?? []);
  } catch {
    // No session, no member record, or an unhappy API — render as though the
    // member holds nothing rather than failing the page.
    return new Set();
  }
}
