import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Auth, plus the path of the page being requested.
 *
 * A server component cannot see its own URL, so the path is passed down as a
 * header for the access log to report. Set on the *request* headers, which
 * are what `headers()` returns, rather than on the response.
 */
export default auth((request) => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  // The console is members-only everywhere except auth routes and assets.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
