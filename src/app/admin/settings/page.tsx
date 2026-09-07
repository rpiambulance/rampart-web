import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { myPermissions } from '@/lib/me';

/**
 * The way in to settings, rather than one page holding all of them.
 *
 * Settings were a single scroll of nine cards covering five unrelated
 * subjects, which made anything past the third hard to find and every visit
 * load data for eight cards nobody was looking at. Each section is its own
 * page now, and this lists them.
 */
const SECTIONS: Array<{
  href: string;
  title: string;
  description: string;
  /** Any one of these is enough to open the section. */
  permissions: string[];
}> = [
  {
    href: '/admin/settings/messaging',
    title: 'Messaging',
    description:
      'Mail server, Slack workspace and channels, and which notifications travel on each.',
    permissions: ['settings:write'],
  },
  {
    href: '/admin/settings/scheduling',
    title: 'Scheduling',
    description:
      'When night crew signups open, how far ahead the schedule runs, drop deadlines, and the minimum age.',
    permissions: ['schedule:settings', 'settings:write'],
  },
  {
    href: '/admin/settings/credentials',
    title: 'Credentials',
    description:
      'What each credential requires before it can be granted, and the roles it confers while held.',
    permissions: ['settings:write'],
  },
  {
    href: '/admin/settings/certifications',
    title: 'Certifications',
    description:
      'The certifications members can hold, their default validity, and which answer for others.',
    permissions: ['settings:write'],
  },
  {
    href: '/admin/settings/events',
    title: 'Events',
    description:
      'The kinds an event can be, which decide how it is colored on the calendar.',
    permissions: ['settings:write'],
  },
];

export default async function SettingsIndexPage() {
  const held = await myPermissions();
  // A section nobody can open is not worth listing; the pages check again.
  const visible = SECTIONS.filter((section) =>
    section.permissions.some((permission) => held.has(permission)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="How the portal behaves, grouped by what it affects."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((section) => (
          <Card key={section.href} className="transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle className="text-base">
                <Link href={section.href} className="after:absolute after:inset-0">
                  {section.title}
                </Link>
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You don&apos;t have access to any settings.
        </p>
      ) : null}
    </div>
  );
}
