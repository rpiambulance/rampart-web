import Link from 'next/link';
import { auth } from '@/auth';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { NAV_GROUPS } from '@/lib/nav';

const DESCRIPTIONS: Record<string, string> = {
  '/admin/tokens': 'Issue and revoke service API tokens with scoped permissions.',
  '/admin/roles': 'Define roles, their permissions, member assignments, and credential links.',
  '/admin/settings': 'Scheduling knobs, certification types, event kinds & tiers, credential requirements.',
  '/admin/vehicles': 'Fleet vehicles available to the fuel log.',
  '/admin/audit': 'Every sensitive mutation across the system, with diffs.',
};

export default async function ConsoleHome() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardHeader>
          <CardTitle>Rampart Admin Console</CardTitle>
          <CardDescription>
            System administration for the RPI Ambulance platform. Sign in with
            your RPIA account.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NAV_GROUPS.flatMap((group) => group.items).map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <CardTitle className="text-base">{item.label}</CardTitle>
                <CardDescription>{DESCRIPTIONS[item.href]}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Looking for scheduling, events, or member management? Those live in the
        member portal (central).
      </p>
    </div>
  );
}
