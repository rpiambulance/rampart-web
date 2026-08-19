import { formatCredKey } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { setCredentialRoles } from './actions';
import { type CredentialType, type RoleOption } from './types';

export function LinkedRolesCard({
  credentialTypes,
  roles,
}: {
  credentialTypes: CredentialType[];
  roles: RoleOption[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credential-conferred roles</CardTitle>
        <CardDescription>
          Members automatically hold the checked roles (and their permissions)
          while the credential is active; suspension or revocation removes
          them. Requires the roles:manage permission to change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {credentialTypes.map((type) => (
          <form
            key={`${type.id}-${type.linkedRoles.map((l) => l.role.id).sort().join(',')}`}
            action={setCredentialRoles.bind(null, type.id)}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b pb-3 last:border-b-0"
          >
            <span className="w-64 text-sm font-medium">
              {type.name}{' '}
              <span className="text-xs text-muted-foreground">({formatCredKey(type.key)})</span>
            </span>
            {roles.map((role) => (
              <label key={role.id} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  name="roleIds"
                  value={role.id}
                  defaultChecked={type.linkedRoles.some((l) => l.role.id === role.id)}
                />
                {role.name}
              </label>
            ))}
            <Button type="submit" size="sm" variant="outline" className="h-6 text-xs">
              Save
            </Button>
          </form>
        ))}
      </CardContent>
    </Card>
  );
}
