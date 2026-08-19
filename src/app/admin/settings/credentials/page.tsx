import { api, ApiError } from '@/lib/api';
import { ErrorBanner } from '@/components/error-banner';
import { PageHeader } from '@/components/page-header';
import { LinkedRolesCard } from '../linked-roles-card';
import { RequirementsCard } from '../requirements-card';
import {
  NoAccess,
  type CertType,
  type CredentialType,
  type EvalTemplate,
  type RoleOption,
  type TrainingClass,
} from '../types';

/**
 * What each credential asks for, and what holding it confers. Both are about
 * the same ladder from opposite ends, so they sit on one page.
 */
export default async function CredentialSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  let credentialTypes: CredentialType[];
  let certTypes: CertType[];
  let evalTemplates: EvalTemplate[];
  let classes: TrainingClass[];
  let roles: RoleOption[];
  try {
    [credentialTypes, certTypes, evalTemplates, classes, roles] =
      await Promise.all([
        api<CredentialType[]>('/v1/credentials/types'),
        api<CertType[]>('/v1/certifications/types'),
        api<EvalTemplate[]>('/v1/evals/templates'),
        api<TrainingClass[]>('/v1/trainings/classes'),
        api<RoleOption[]>('/v1/roles'),
      ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoAccess />;
    throw err;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credentials"
        description="What each credential requires, and the roles it confers while held."
      />
      <ErrorBanner message={error} />
      <RequirementsCard
        credentialTypes={credentialTypes}
        certTypes={certTypes}
        evalTemplates={evalTemplates}
        classes={classes}
      />
      <LinkedRolesCard credentialTypes={credentialTypes} roles={roles} />
    </div>
  );
}
