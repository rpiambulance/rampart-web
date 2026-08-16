import { api, ApiError } from '@/lib/api';
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
import { resolveConflict, startMigration } from './actions';

type ConflictOption = {
  action: 'link' | 'replace' | 'skip';
  label: string;
  description: string;
  suggestion?: string;
};

type MigrationConflict = {
  id: string;
  entity: string;
  label: string;
  fields: string[];
  values: Record<string, string>;
  existing?: { id: number; summary: string };
  options: ConflictOption[];
};

type RunState = {
  status: 'idle' | 'running' | 'awaiting-input' | 'succeeded' | 'failed';
  startedAt?: string;
  finishedAt?: string;
  startedBy?: string;
  progress: string[];
  error?: string;
  pendingConflict?: MigrationConflict;
};

// Always read fresh status, never a cached render.
export const dynamic = 'force-dynamic';

function NoAccess() {
  return (
    <Card className="mx-auto mt-12 max-w-md">
      <CardHeader>
        <CardTitle>You don&apos;t have access</CardTitle>
        <CardDescription>
          Running the legacy migration requires the
          <code className="mx-1">system:migrate-legacy</code> permission.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

const STATUS_BADGE: Record<RunState['status'], React.ReactNode> = {
  idle: <Badge variant="secondary">Not started</Badge>,
  running: <Badge>Running…</Badge>,
  'awaiting-input': <Badge variant="secondary">Needs your input</Badge>,
  succeeded: <Badge>Succeeded</Badge>,
  failed: <Badge variant="destructive">Failed</Badge>,
};

/**
 * The import pauses here whenever legacy data collides with a uniqueness
 * constraint. It never guesses — one question at a time until it's answered.
 */
function ConflictPrompt({ conflict }: { conflict: MigrationConflict }) {
  const fieldList = conflict.fields.join(', ');
  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="text-base">
          The import needs a decision
        </CardTitle>
        <CardDescription>
          <span className="font-medium">{conflict.label}</span> can&apos;t be
          imported because its {fieldList} is already in use. The import is
          paused until you choose.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="rounded-md bg-muted p-3 text-sm">
          {Object.entries(conflict.values).map(([field, value]) => (
            <div key={field} className="flex gap-2">
              <dt className="font-medium">{field}:</dt>
              <dd className="font-mono">{value || '(blank)'}</dd>
            </div>
          ))}
          {conflict.existing ? (
            <div className="mt-2 flex gap-2 border-t pt-2">
              <dt className="font-medium">already used by:</dt>
              <dd>
                #{conflict.existing.id} {conflict.existing.summary}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="space-y-3">
          {conflict.options.map((option) => (
            <form
              key={option.action}
              action={resolveConflict}
              className="rounded-md border p-3"
            >
              <input type="hidden" name="conflictId" value={conflict.id} />
              <input type="hidden" name="action" value={option.action} />
              <p className="text-sm font-medium">{option.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {option.description}
              </p>
              {option.action === 'replace' ? (
                <input
                  name="value"
                  defaultValue={option.suggestion ?? ''}
                  placeholder={`New ${conflict.fields[0]}`}
                  autoComplete="off"
                  className="mt-2 w-full rounded-md border bg-transparent px-3 py-1.5 font-mono text-sm"
                />
              ) : null}
              <Button
                type="submit"
                size="sm"
                variant={option.action === 'skip' ? 'outline' : 'default'}
                className="mt-2"
              >
                {option.action === 'link'
                  ? 'Use existing record'
                  : option.action === 'replace'
                    ? `Import with this ${conflict.fields[0]}`
                    : 'Skip'}
              </Button>
            </form>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function LegacyMigrationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  let state: RunState;
  try {
    state = await api<RunState>('/v1/admin/legacy-migration');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoAccess />;
    throw err;
  }

  const running = state.status === 'running' || state.status === 'awaiting-input';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legacy Migration"
        description="One-shot import from the old MySQL portal (members, credentials, certifications, crews, games/events, fuel and radio logs)."
      />
      <ErrorBanner message={error} />

      {state.status === 'awaiting-input' && state.pendingConflict ? (
        <ConflictPrompt
          key={state.pendingConflict.id}
          conflict={state.pendingConflict}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Status {STATUS_BADGE[state.status]}
          </CardTitle>
          <CardDescription>
            {state.startedAt
              ? `Started ${new Date(state.startedAt).toLocaleString()}${
                  state.startedBy ? ` by ${state.startedBy}` : ''
                }${
                  state.finishedAt
                    ? ` · finished ${new Date(state.finishedAt).toLocaleString()}`
                    : ''
                }`
              : 'No migration has been run on this API instance.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.progress.length ? (
            <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
              {state.progress.join('\n')}
            </pre>
          ) : null}
          {state.error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          {running ? (
            <p className="text-sm text-muted-foreground">
              The import runs in the background. Reload this page to refresh
              progress — and to see any question it&apos;s waiting on.
            </p>
          ) : null}
          <Button
            render={<a href="/admin/legacy-migration" />}
            variant="outline"
            size="sm"
          >
            Refresh status
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run the import</CardTitle>
          <CardDescription>
            Safe to re-run: every row is matched on its legacy id and updated
            rather than duplicated. The API must be able to reach the MySQL
            host. The password is never written to the audit log. Where legacy
            data collides with a uniqueness rule, the import pauses and asks you
            what to do rather than guessing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={startMigration} className="space-y-3">
            <label className="block text-sm">
              Legacy MySQL connection string
              <input
                name="mysqlUrl"
                required
                placeholder="mysql://user:password@host:3306/ambulanc_web"
                autoComplete="off"
                className="mt-1 w-full rounded-md border bg-transparent px-3 py-1.5 font-mono text-sm"
              />
            </label>
            <Button type="submit" disabled={running}>
              {running ? 'Migration in progress…' : 'Start migration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
