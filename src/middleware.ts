export { auth as middleware } from '@/auth';

export const config = {
  // The console is members-only everywhere except auth routes and assets.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
