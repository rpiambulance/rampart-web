import { headers } from 'next/headers';
import { auth } from '@/auth';

const API_URL = process.env.RAMPART_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API request failed with ${status}`);
  }
}

/**
 * Server-side fetch against the Rampart API, forwarding the caller's
 * Keycloak access token. Use from server components / route handlers only.
 */
/**
 * Who this call is really being made for.
 *
 * These requests leave this server, not the admin's browser, so without
 * saying so every row in the API's log is attributed to the console itself
 * — true, and useless. Named in a header of the API's choosing rather than
 * folded into X-Forwarded-For, whose entries are counted from the right and
 * would land on the wrong one for this leg.
 */
async function callerHeaders(): Promise<Record<string, string>> {
  try {
    const incoming = await headers();
    const caller = incoming.get('x-forwarded-for')?.split(',')[0]?.trim();
    const agent = incoming.get('user-agent');
    return {
      ...(caller ? { 'x-rampart-client-ip': caller } : {}),
      ...(agent ? { 'user-agent': agent } : {}),
    };
  } catch {
    return {};
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const session = await auth();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {}),
      ...(await callerHeaders()),
      ...init.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => null));
  }
  return res.json() as Promise<T>;
}
