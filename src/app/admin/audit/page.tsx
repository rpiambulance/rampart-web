import { api, ApiError } from '@/lib/api';
import { prefers12Hour } from '@/lib/me';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { formatDateTime } from '@/lib/format';

type AuditEntry = {
  id: string;
  kind: 'DECISION' | 'PAGE' | 'API';
  actorType: 'MEMBER' | 'API_TOKEN' | 'SYSTEM';
  actorName: string;
  action: string;
  entity: string;
  entityId: string | null;
  diff: unknown;
  ip: string | null;
  at: string;
};

/**
 * The log holds three kinds of thing and they answer different questions.
 * Decisions are what somebody changed; page loads and API calls are where
 * they went. Filtered rather than separated, because "what did this person
 * do on Tuesday" is one question.
 */
const KINDS = [
  { key: 'all', label: 'Everything' },
  { key: 'decision', label: 'Decisions' },
  { key: 'page', label: 'Page loads' },
  { key: 'api', label: 'API calls' },
] as const;

const KIND_LABEL: Record<AuditEntry['kind'], string> = {
  DECISION: 'decision',
  PAGE: 'page',
  API: 'api',
};

function NoAccess() {
  return (
    <Card className="mx-auto mt-12 max-w-md">
      <CardHeader>
        <CardTitle>You don&apos;t have access</CardTitle>
        <CardDescription>
          The audit log requires the audit:read permission.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string; kind?: string; q?: string }>;
}) {
  const hour12 = await prefers12Hour();
  const { limit, kind, q } = await searchParams;
  const take = limit && /^\d+$/.test(limit) ? Math.min(Number(limit), 500) : 100;
  const chosen = KINDS.find((option) => option.key === kind)?.key ?? 'all';
  const search = (q ?? '').trim();
  const query = new URLSearchParams({ limit: String(take), kind: chosen });
  if (search) query.set('q', search);

  let entries: AuditEntry[];
  try {
    entries = await api<AuditEntry[]>(`/v1/audit?${query}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoAccess />;
    throw err;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description={`What was changed, and where people went — newest first (showing ${entries.length}).`}
      />

      <div className="flex flex-wrap items-center gap-2">
        {KINDS.map((option) => {
          const params = new URLSearchParams({ kind: option.key });
          if (search) params.set('q', search);
          if (take !== 100) params.set('limit', String(take));
          return (
            <a
              key={option.key}
              href={`/admin/audit?${params}`}
              className={`rounded-md border px-3 py-1 text-sm ${
                chosen === option.key
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {option.label}
            </a>
          );
        })}
        <form className="ml-auto flex items-center gap-2" action="/admin/audit">
          <input type="hidden" name="kind" value={chosen} />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Action, entity or path"
            className="h-8 w-56 rounded-md border border-input bg-background px-2 text-sm"
          />
          <button
            type="submit"
            className="h-8 rounded-md border px-3 text-sm hover:bg-muted"
          >
            Search
          </button>
        </form>
      </div>

      {entries.length ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDateTime(entry.at, hour12)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.kind === 'DECISION' ? 'default' : 'outline'
                      }
                      className="text-[10px]"
                    >
                      {KIND_LABEL[entry.kind]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-sm">{entry.actorName}</span>{' '}
                    <Badge
                      variant={entry.actorType === 'SYSTEM' ? 'outline' : 'secondary'}
                      className="text-[10px]"
                    >
                      {entry.actorType === 'API_TOKEN' ? 'token' : entry.actorType.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {entry.kind === 'DECISION' ? (
                      <>
                        {entry.entity}
                        {entry.entityId ? ` #${entry.entityId}` : ''}
                      </>
                    ) : (
                      <span className="font-mono" title={entry.entityId ?? ''}>
                        {entry.entityId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.diff != null ? (
                      <details className="max-w-md text-xs text-muted-foreground">
                        <summary className="cursor-pointer">diff</summary>
                        <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2">
                          {JSON.stringify(entry.diff, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing matching that.
        </p>
      )}

      {entries.length === take ? (
        <a
          href={`/admin/audit?kind=${chosen}${
            search ? `&q=${encodeURIComponent(search)}` : ''
          }&limit=${Math.min(take * 2, 500)}`}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Show more
        </a>
      ) : null}
    </div>
  );
}
