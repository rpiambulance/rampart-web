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
