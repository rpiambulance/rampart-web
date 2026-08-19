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
} from './actions';
import { Dash, INPUT_CLS as inputCls, StatusBadge, type CertType } from './types';

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
