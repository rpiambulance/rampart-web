import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { saveNotificationChannels } from './actions';

export type MessageTypeSetting = {
  key: string;
  label: string;
  description: string;
  audience: 'member' | 'officers';
  channels: { email: boolean; slack: boolean };
};

const AUDIENCE_LABEL: Record<string, string> = {
  member: 'To the member',
  officers: 'To officers',
};

/**
 * Which channels carry which messages. The inbox always gets a copy, so these
 * settings decide how a message travels rather than whether it exists —
 * turning both off still leaves it where the member can find it.
 */
export function NotificationsCard({ types }: { types: MessageTypeSetting[] }) {
  const groups = ['officers', 'member'].filter((audience) =>
    types.some((type) => type.audience === audience),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notifications</CardTitle>
        <CardDescription>
          Every message is written to the recipient&apos;s inbox. These settings
          decide what is also pushed out by email or Slack, so switching both
          off makes a message quieter rather than losing it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={saveNotificationChannels} className="space-y-4">
          {groups.map((audience) => (
            <div key={audience} className="space-y-2">
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {AUDIENCE_LABEL[audience]}
              </h4>
              <div className="rounded-md border">
                {types
                  .filter((type) => type.audience === audience)
                  .map((type) => (
                    <div
                      key={type.key}
                      className="flex flex-wrap items-center gap-3 border-b px-3 py-2 last:border-b-0"
                    >
                      <div className="min-w-64 flex-1">
                        <p className="text-sm font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          name={`email:${type.key}`}
                          defaultChecked={type.channels.email}
                          className="size-4"
                        />
                        Email
                      </label>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          name={`slack:${type.key}`}
                          defaultChecked={type.channels.slack}
                          className="size-4"
                        />
                        Slack
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <Button type="submit" size="sm">
            Save notification settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
