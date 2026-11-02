import { formatCredKey } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { addRequirement, removeRequirement } from './actions';
import { RequirementDateFields, requirementDatesSummary } from './requirement-dates';
import { RequirementScope } from './requirement-scope';
import {
  INPUT_CLS as inputCls,
  type CertType,
  type ClassSeries,
  type CredentialType,
  type EvalTemplate,
  type Requirement,
  type TrainingClass,
} from './types';

function requirementLabel(req: Requirement): string {
  if (req.kind === 'CERTIFICATION') {
    return `Certification: ${req.certificationType?.name ?? 'unknown'}`;
  }
  if (req.kind === 'EVALUATION_COUNT') {
    return `${req.count ?? 1} × evaluation: ${req.evalTemplate?.name ?? 'unknown'}`;
  }
  if (req.kind === 'CHECKLIST') {
    return `Checklist: ${req.evalTemplate?.name ?? 'unknown'}`;
  }
  if (req.classSeries) return `Any session of: ${req.classSeries.name}`;
  return `Class: ${req.class?.name ?? 'unknown'}`;
}

/** The requirement, with its dates after it when it has any. */
function RequirementText({ req }: { req: Requirement }) {
  const dates = requirementDatesSummary(req);
  return (
    <span>
      {requirementLabel(req)}
      {dates ? <span className="text-xs text-muted-foreground"> · {dates}</span> : null}
    </span>
  );
}

function RemoveRequirement({ id }: { id: number }) {
  return (
    <form action={removeRequirement.bind(null, id)}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-destructive"
      >
        remove
      </Button>
    </form>
  );
}

/** Requirements sharing a group are alternatives; the label says so once. */

function groupedRequirements(requirements: Requirement[]) {
  const standalone = requirements.filter((req) => !req.alternativeGroup);
  const groups = new Map<string, Requirement[]>();
  for (const req of requirements) {
    if (!req.alternativeGroup) continue;
    groups.set(req.alternativeGroup, [
      ...(groups.get(req.alternativeGroup) ?? []),
      req,
    ]);
  }
  return { standalone, groups };
}

export function RequirementsCard({
  credentialTypes,
  certTypes,
  evalTemplates,
  classes,
  series,
}: {
  credentialTypes: CredentialType[];
  certTypes: CertType[];
  evalTemplates: EvalTemplate[];
  classes: TrainingClass[];
  series: ClassSeries[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credential requirements</CardTitle>
        <CardDescription>
          What a member must complete before each credential can be granted.
          For the add form, fill in only the field matching the selected kind.
          A promotion requirement is checked once, on the way up, so adding one
          never reaches back and suspends somebody promoted under the old
          rules. An ongoing requirement is checked continuously and does
          suspend — give it an in-force date so it only bites going forward,
          and holders are reminded before it does. For something seasonal,
          give it an end date too; for something that must be renewed, say
          what counts (done on or after a date, good through a date) or pick
          a class series, whose sessions last as long as the series says.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {credentialTypes.map((type) => (
          <div key={type.id} className="space-y-2">
            <h3 className="text-sm font-medium">
              {type.name}{' '}
              <span className="text-xs text-muted-foreground">({formatCredKey(type.key)})</span>
            </h3>
            {type.requirements.length ? (
              <ul className="space-y-1">
                {groupedRequirements(type.requirements).standalone.map((req) => (
                  <li key={req.id} className="flex items-center gap-2 text-sm">
                    <RequirementText req={req} />
                    <RequirementScope req={req} />
                    <RemoveRequirement id={req.id} />
                  </li>
                ))}
                {/* Alternatives are listed under their shared label so it is
                    obvious that meeting one of them is enough. */}
                {[...groupedRequirements(type.requirements).groups].map(
                  ([label, reqs]) => (
                    <li key={label} className="text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {' '}
                        — any one of:
                      </span>
                      <ul className="ml-4 space-y-1 border-l pl-3">
                        {reqs.map((req) => (
                          <li
                            key={req.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <RequirementText req={req} />
                            <RequirementScope req={req} />
                            <RemoveRequirement id={req.id} />
                          </li>
                        ))}
                      </ul>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No requirements.</p>
            )}
            <form
              action={addRequirement.bind(null, type.id)}
              className="flex flex-wrap items-end gap-2"
            >
              <label className="grid gap-1 text-xs text-muted-foreground">
                Kind
                <select name="kind" required defaultValue="" className={inputCls}>
                  <option value="" disabled>
                    Select kind…
                  </option>
                  <option value="CERTIFICATION">Certification</option>
                  <option value="EVALUATION_COUNT">Evaluation count</option>
                  <option value="CHECKLIST">Checklist</option>
                  <option value="CLASS">Class</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                When it applies
                <select name="scope" defaultValue="PROMOTION" className={inputCls}>
                  <option value="PROMOTION">At promotion only</option>
                  <option value="ONGOING">Ongoing only</option>
                  <option value="BOTH">Both</option>
                </select>
              </label>
              <RequirementDateFields />
              <label className="grid gap-1 text-xs text-muted-foreground">
                Either/or group (optional)
                <input
                  name="alternativeGroup"
                  placeholder="Driving qualification"
                  title="Give two requirements the same label and meeting either one is enough."
                  className={inputCls}
                />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Certification type
                <select
                  name="certificationTypeId"
                  defaultValue=""
                  className={inputCls}
                >
                  <option value="">—</option>
                  {certTypes.map((cert) => (
                    <option key={cert.id} value={cert.id}>
                      {cert.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Evaluation or checklist
                <select name="evalTemplateId" defaultValue="" className={inputCls}>
                  <option value="">—</option>
                  {evalTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.kind === 'CHECKLIST' ? 'Checklist: ' : ''}
                      {template.name} (v{template.version})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Count
                <input
                  type="number"
                  name="count"
                  min={1}
                  className={`${inputCls} w-20`}
                />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Class
                <select name="classId" defaultValue="" className={inputCls}>
                  <option value="">—</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                or class series
                <select
                  name="classSeriesId"
                  defaultValue=""
                  title="Any session in the series counts, this year's or next — for a refresher."
                  className={inputCls}
                >
                  <option value="">—</option>
                  {series.map((one) => (
                    <option key={one.id} value={one.id}>
                      {one.name}
                      {one.validityMonths ? ` (${one.validityMonths} mo)` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" size="sm" variant="outline">
                Add requirement
              </Button>
            </form>
          </div>
        ))}
        {!credentialTypes.length ? (
          <p className="text-sm text-muted-foreground">No credential types.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
