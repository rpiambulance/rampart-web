import Link from 'next/link';
import { auth, signIn, signOut } from '@/auth';
import { api } from '@/lib/api';
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
  try {
    const me = await api<{ permissions?: string[] }>('/v1/members/me');
    permissions = new Set(me?.permissions ?? []);
  } catch {
    // unlinked/inactive members: no permissions -> denied below
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
