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
import {
  INPUT_CLS as inputCls,
  type CertType,
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
  return `Class: ${req.class?.name ?? 'unknown'}`;
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
}: {
  credentialTypes: CredentialType[];
  certTypes: CertType[];
  evalTemplates: EvalTemplate[];
  classes: TrainingClass[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credential requirements</CardTitle>
        <CardDescription>
          What a member must complete before each credential can be granted.
          For the add form, fill in only the field matching the selected kind.
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
                    <span>{requirementLabel(req)}</span>
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
                            <span>{requirementLabel(req)}</span>
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
