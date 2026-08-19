import { api, ApiError } from '@/lib/api';
import { ErrorBanner } from '@/components/error-banner';
import { PageHeader } from '@/components/page-header';
import { EventKindsCard } from '../event-kinds-card';
import { NoAccess, type EventKind } from '../types';

export default async function EventSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  let kinds: EventKind[];
  try {
    kinds = await api<EventKind[]>('/v1/events/kinds');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoAccess />;
    throw err;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="The kinds an event can be, which decide how it is coloured on the calendar."
      />
      <ErrorBanner message={error} />
      <EventKindsCard kinds={kinds} />
    </div>
  );
}
