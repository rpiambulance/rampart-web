import { api, ApiError } from '@/lib/api';
import { ErrorBanner } from '@/components/error-banner';
import { PageHeader } from '@/components/page-header';
import { CertLaddersCard } from '../cert-ladders-card';
import { CertTypesCard } from '../cert-types-card';
import { NoAccess, type CertType } from '../types';

/**
 * The types themselves and the ladder that ranks them. One page because a
 * ladder is built out of the types above it — editing them apart would mean
 * moving between two screens to do one job.
 */
export default async function CertificationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  let certTypes: CertType[];
  try {
    certTypes = await api<CertType[]>('/v1/certifications/types');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoAccess />;
    throw err;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certifications"
        description="The certifications members can hold, and which of them answer for others."
      />
      <ErrorBanner message={error} />
      <CertTypesCard types={certTypes} />
      <CertLaddersCard types={certTypes} />
    </div>
  );
}
