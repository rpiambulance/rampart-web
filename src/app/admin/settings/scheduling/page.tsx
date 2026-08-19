import { api, ApiError } from '@/lib/api';
import { ErrorBanner } from '@/components/error-banner';
import { PageHeader } from '@/components/page-header';
import { SchedulingCard } from '../scheduling-card';
import { NoAccess, type SchedulingKnobs } from '../types';

export default async function SchedulingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  let knobs: SchedulingKnobs;
  try {
    knobs = await api<SchedulingKnobs>('/v1/crews/settings');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoAccess />;
    throw err;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling"
        description="The rules the night crew schedule runs on: when signups open, how far ahead, and who may take what."
      />
      <ErrorBanner message={error} />
      <SchedulingCard knobs={knobs} />
    </div>
  );
}
