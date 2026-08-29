import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import {
  createCertificationType,
  deactivateCertificationType,
  setCertificationFields,
} from './actions';
import {
  Dash,
  INPUT_CLS as inputCls,
  StatusBadge,
  type CertType,
  type FieldRequirement,
} from './types';

/**
 * Which details a type asks for, and whether they may be left blank.
 *
 * Hidden is not merely cosmetic: the API drops a hidden field rather than
 * trusting it, because the form is not the only way a submission can arrive.
 */
const FIELDS = [
  { name: 'identifierField', label: 'Number' },
  { name: 'issuedAtField', label: 'Issued' },
  { name: 'expiresAtField', label: 'Expires' },
  { name: 'documentField', label: 'File' },
] as const;

const CHOICES: FieldRequirement[] = ['HIDDEN', 'OPTIONAL', 'REQUIRED'];

function FieldRules({ type }: { type: CertType }) {
  return (
    <form
      action={setCertificationFields.bind(null, type.id)}
      className="flex flex-wrap items-end gap-2"
    >
      {FIELDS.map((field) => (
        <label
          key={field.name}
          className="grid gap-1 text-[10px] uppercase tracking-wide text-muted-foreground"
        >
          {field.label}
          <select
            name={field.name}
            defaultValue={type[field.name] ?? 'OPTIONAL'}
            className={`${inputCls} h-7 text-xs`}
          >
            {CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {choice.charAt(0) + choice.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      ))}
      <Button type="submit" variant="outline" size="sm" className="h-7 text-xs">
        Save fields
      </Button>
    </form>
  );
}

export function CertTypesCard({ types }: { types: CertType[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Certification types</CardTitle>
        <CardDescription>
          Certifications members can submit for verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {types.length ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Abbrev.</TableHead>
                  <TableHead>Issuing org</TableHead>
                  <TableHead>Validity (months)</TableHead>
                  <TableHead>Fields asked for</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.abbreviation}</TableCell>
                    <TableCell>{type.issuingOrg ?? <Dash />}</TableCell>
                    <TableCell>
                      {type.defaultValidityMonths ?? <Dash />}
                    </TableCell>
                    <TableCell>
                      <FieldRules type={type} />
                    </TableCell>
                    <TableCell>
                      {type.active === false ? (
                        <Badge variant="secondary">Inactive</Badge>
                      ) : (
                        <form
                          action={deactivateCertificationType.bind(
                            null,
                            type.id,
                          )}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-destructive"
                          >
                            deactivate
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No certification types yet.
          </p>
        )}
        <form
          action={createCertificationType}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="grid gap-1 text-xs text-muted-foreground">
            Name
            <input type="text" name="name" required className={`${inputCls} w-48`} />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Abbreviation
            <input
              type="text"
              name="abbreviation"
              required
              className={`${inputCls} w-24`}
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Issuing org (optional)
            <input type="text" name="issuingOrg" className={`${inputCls} w-40`} />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Validity months (optional)
            <input
              type="number"
              name="defaultValidityMonths"
              min={1}
              className={`${inputCls} w-32`}
            />
          </label>
          <Button type="submit" size="sm">
            Add type
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Certification ladders. Each is a chain from the highest certification down
 * to the lowest, so a Paramedic satisfies an EMT requirement without anyone
 * pairing every certification with every other.
 */
