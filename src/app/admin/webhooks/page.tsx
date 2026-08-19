import { api, ApiError } from '@/lib/api';
import { prefers12Hour } from '@/lib/me';
import { formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ErrorBanner } from '@/components/error-banner';
import { PageHeader } from '@/components/page-header';
import { createWebhook, deleteWebhook, updateWebhook } from './actions';

type WebhookEvent = { key: string; label: string; description: string };

type Webhook = {
  id: number;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  lastStatus: number | null;
  lastAt: string | null;
  lastError: string | null;
  createdBy: { id: number; firstName: string; lastName: string } | null;
};

const FIELD = 'h-8 rounded-md border border-input bg-background px-2 text-sm';

function NoAccess() {
  return (
    <Card className="mx-auto mt-12 max-w-md">
      <CardHeader>
        <CardTitle>You don&apos;t have access</CardTitle>
        <CardDescription>
          Managing integrations requires additional permissions.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

/** Whether the endpoint is answering, from the last attempt alone. */
function Health({ hook }: { hook: Webhook }) {
  if (!hook.lastAt) return <Badge variant="outline">Never called</Badge>;
  if (hook.lastStatus && hook.lastStatus < 300) {
    return <Badge>Healthy</Badge>;
  }
  return <Badge variant="destructive">Failing</Badge>;
}

export default async function WebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; secret?: string }>;
}) {
  const { error, secret } = await searchParams;
  const hour12 = await prefers12Hour();

  let hooks: Webhook[];
  let events: WebhookEvent[];
  try {
    [hooks, events] = await Promise.all([
      api<Webhook[]>('/v1/webhooks'),
      api<WebhookEvent[]>('/v1/webhooks/events'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoAccess />;
    throw err;
  }

  const checkboxes = (name: string, selected: string[]) => (
    <div className="grid gap-1 sm:grid-cols-2">
      {events.map((event) => (
        <label key={event.key} className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name={name}
            value={event.key}
            defaultChecked={selected.includes(event.key)}
            className="mt-1 size-3.5"
          />
          <span>
            {event.label}
            <span className="block text-xs text-muted-foreground">
              {event.description}
            </span>
          </span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhooks"
        description="Tell another system when something happens here."
      />
      <ErrorBanner message={error} />

      {secret ? (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">Copy this signing secret</CardTitle>
            <CardDescription>
              It is shown once and cannot be recovered. The receiver uses it to
              check that a delivery really came from here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">
              {secret}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How deliveries are signed</CardTitle>
          <CardDescription>
            Each POST carries <code>X-Rampart-Event</code>,{' '}
            <code>X-Rampart-Timestamp</code> and <code>X-Rampart-Signature</code>.
            The signature is <code>v1=</code> followed by an HMAC-SHA256 of{' '}
            <code>{'{timestamp}.{body}'}</code> keyed with the secret. Check the
            timestamp as well as the signature — that is what stops a captured
            delivery being replayed later. Three attempts are made, backing off,
            and anything that answers 2xx counts as delivered.
          </CardDescription>
        </CardHeader>
      </Card>

      {hooks.map((hook) => (
        <Card key={hook.id}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{hook.name}</CardTitle>
              <Health hook={hook} />
              {hook.active ? null : <Badge variant="secondary">Paused</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">
                {hook.lastAt
                  ? `Last tried ${formatDateTime(hook.lastAt, hour12)}${
                      hook.lastError ? ` — ${hook.lastError}` : ''
                    }`
                  : 'Not called yet'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form
              action={updateWebhook.bind(null, hook.id)}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-end gap-2">
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Name
                  <input
                    name="name"
                    defaultValue={hook.name}
                    required
                    className={`${FIELD} w-48`}
                  />
                </label>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  URL
                  <input
                    name="url"
                    defaultValue={hook.url}
                    required
                    className={`${FIELD} w-96`}
                  />
                </label>
                <label className="flex h-8 items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={hook.active}
                    className="size-3.5"
                  />
                  Active
                </label>
              </div>
              <fieldset>
                <legend className="text-xs text-muted-foreground">
                  Events — none selected means every event
                </legend>
                {checkboxes('events', hook.events)}
              </fieldset>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Save
                </Button>
              </div>
            </form>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Delete this webhook
              </summary>
              <form
                action={deleteWebhook.bind(null, hook.id)}
                className="mt-2"
              >
                <Button type="submit" size="sm" variant="destructive">
                  Delete {hook.name}
                </Button>
              </form>
            </details>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New webhook</CardTitle>
          <CardDescription>
            The signing secret is generated here and shown once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createWebhook} className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-xs text-muted-foreground">
                Name
                <input name="name" required className={`${FIELD} w-48`} />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                URL
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="https://example.org/hooks/rampart"
                  className={`${FIELD} w-96`}
                />
              </label>
            </div>
            <fieldset>
              <legend className="text-xs text-muted-foreground">
                Events — none selected means every event
              </legend>
              {checkboxes('events', [])}
            </fieldset>
            <Button type="submit" size="sm">
              Create webhook
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
