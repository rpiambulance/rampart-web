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
import { startMigration } from './actions';

type RunState = {
  status: 'idle' | 'running' | 'succeeded' | 'failed';
  startedAt?: string;
  finishedAt?: string;
  startedBy?: string;
  progress: string[];
  error?: string;
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
  succeeded: <Badge>Succeeded</Badge>,
  failed: <Badge variant="destructive">Failed</Badge>,
};

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

  const running = state.status === 'running';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legacy Migration"
        description="One-shot import from the old MySQL portal (members, credentials, certifications, crews, games/events, fuel and radio logs)."
      />
      <ErrorBanner message={error} />

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
              progress.
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
            host. The password is never written to the audit log.
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
