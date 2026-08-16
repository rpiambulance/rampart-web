import Link from 'next/link';
import { auth, signIn, signOut } from '@/auth';
import { api, ApiError } from '@/lib/api';
import { ThemeToggle } from '@/components/theme-toggle';
import { TopNavMenus } from '@/components/top-nav-menus';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { filterNavGroups, hasConsoleAccess } from '@/lib/nav';

function SignOutButton({ name }: { name: string }) {
  return (
    <form
      action={async () => {
        'use server';
        await signOut();
      }}
    >
      <Button variant="outline" size="sm" type="submit">
        Sign out {name}
      </Button>
    </form>
  );
}

function SignInButton() {
  return (
    <form
      action={async () => {
        'use server';
        await signIn('keycloak');
      }}
    >
      <Button size="sm" type="submit">
        Sign in
      </Button>
    </form>
  );
}

const MAIN = 'flex-1 container mx-auto max-w-6xl px-4 py-6';

function Header({ right }: { right: React.ReactNode }) {
  return (
    <>
      <div aria-hidden className="h-1 bg-primary" />
      <header className="border-b bg-background">
        <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="font-heading font-semibold tracking-tight text-primary"
          >
            Rampart Admin
          </Link>
          {right}
        </div>
      </header>
    </>
  );
}

/**
 * Admin-console chrome: fixed top navbar. Entry requires at least one
 * console permission (tokens/roles/settings/vehicles/audit) — everyone
 * else gets an access-denied screen. The member portal lives in `central`.
 */
export async function NavShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="min-h-full flex flex-col">
        <Header
          right={
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <SignInButton />
            </div>
          }
        />
        <main className={MAIN}>{children}</main>
      </div>
    );
  }

  let permissions = new Set<string>();
  // Capture *why* access failed — otherwise several very different problems
  // (unlinked account, inactive member, unreachable or outdated API) all
  // render the same blank denial screen and are impossible to tell apart.
  let diagnostic: string | undefined;
  try {
    const me = await api<{ permissions?: string[] }>('/v1/members/me');
    if (!Array.isArray(me?.permissions)) {
      diagnostic =
        'The API did not return a permission list. It is probably running a ' +
        'build older than the console — redeploy the API.';
    }
    permissions = new Set(me?.permissions ?? []);
  } catch (error) {
    if (error instanceof ApiError) {
      const code = (error.body as { code?: string } | null)?.code;
      if (code === 'NO_MEMBER_RECORD') {
        diagnostic =
          'Your Keycloak account is not linked to a member record. An ' +
          'administrator must link it (Member.keycloakSubject), or you must ' +
          'sign in once with a verified email that matches a member.';
      } else if (code === 'INACTIVE_MEMBER') {
        diagnostic = 'Your membership is marked inactive.';
      } else {
        diagnostic = `The API rejected this account (HTTP ${error.status}).`;
      }
    } else {
      diagnostic =
        'The console could not reach the API. Check RAMPART_API_URL and that ' +
        'the API is running.';
    }
  }
  const name = session.user.name ?? '';

  if (!hasConsoleAccess(permissions)) {
    return (
      <div className="min-h-full flex flex-col">
        <Header
          right={
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <SignOutButton name={name} />
            </div>
          }
        />
        <main className={MAIN}>
          <Card className="mx-auto mt-12 max-w-md">
            <CardHeader>
              <CardTitle>Administrators only</CardTitle>
              <CardDescription>
                This console is for system administration. The member portal
                is at the main members site. If you believe you need access
                here, contact an administrator.
              </CardDescription>
              {diagnostic ? (
                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium">Details: </span>
                  {diagnostic}
                </p>
              ) : (
                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium">Details: </span>
                  Your account is linked and active, but holds no
                  administrative permission.
                </p>
              )}
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header
        right={
          <>
            <TopNavMenus groups={filterNavGroups(permissions)} />
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <SignOutButton name={name} />
            </div>
          </>
        }
      />
      <main className={MAIN}>{children}</main>
    </div>
  );
}
