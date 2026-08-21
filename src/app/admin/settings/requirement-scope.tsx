'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { requirementImpact, setRequirementScope } from './actions';
import { INPUT_CLS as inputCls, type Requirement } from './types';

type Impact = Awaited<ReturnType<typeof requirementImpact>>;

const SCOPE_LABEL: Record<string, string> = {
  PROMOTION: 'At promotion only',
  ONGOING: 'Ongoing only',
  BOTH: 'Promotion and ongoing',
};

/**
 * Changing when a requirement applies, with the damage shown first.
 *
 * Making a requirement ongoing is the only edit on this page that can take a
 * credential off somebody who already holds it, and the people it catches are
 * mostly the ones who never had to meet it — migrated records, promotions made
 * before the rule existed. So the switch shows who it would catch and offers
 * to excuse exactly them before it is thrown.
 */
export function RequirementScope({ req }: { req: Requirement }) {
  const scope = req.scope ?? 'PROMOTION';
  const [impact, setImpact] = useState<Impact | null>(null);
  const [loading, startLoading] = useTransition();

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open || impact) return;
        startLoading(async () => {
          try {
            setImpact(await requirementImpact(req.id));
          } catch {
            setImpact(null);
          }
        });
      }}
    >
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            {scope === 'PROMOTION' ? 'at promotion' : SCOPE_LABEL[scope].toLowerCase()}
          </Button>
        }
      />
      <PopoverContent className="w-80" align="start">
        <PopoverHeader>
          <PopoverTitle>When is this checked?</PopoverTitle>
          <PopoverDescription>
            At promotion means once, on the way up — tightening it later never
            reaches back. Ongoing means it is re-checked nightly and a lapse
            suspends the credential.
          </PopoverDescription>
        </PopoverHeader>
        <form action={setRequirementScope.bind(null, req.id)} className="grid gap-2">
          <label className="grid gap-1 text-xs text-muted-foreground">
            Scope
            <select name="scope" defaultValue={scope} className={inputCls}>
              {Object.entries(SCOPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            In force from (optional)
            <input
              type="date"
              name="effectiveFrom"
              defaultValue={req.effectiveFrom?.slice(0, 10) ?? ''}
              className={inputCls}
            />
          </label>

          {loading ? (
            <p className="text-xs text-muted-foreground">Checking who this affects…</p>
          ) : impact && !impact.enforceable ? (
            <p className="text-xs text-muted-foreground">
              Only certification requirements can be checked on an ongoing
              basis — nothing else expires on its own.
            </p>
          ) : impact && impact.members.length ? (
            <div className="grid gap-1 rounded border border-destructive/40 p-2">
              <p className="text-xs font-medium text-destructive">
                Made ongoing today, this would suspend {impact.members.length}{' '}
                {impact.members.length === 1 ? 'member' : 'members'}:
              </p>
              <ul className="max-h-32 overflow-auto text-xs text-muted-foreground">
                {impact.members.map((member) => (
                  <li key={member.id}>
                    {member.name} — {member.reason}
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" name="grandfather" defaultChecked />
                Excuse these members, so the rule only applies going forward
              </label>
            </div>
          ) : impact ? (
            <p className="text-xs text-muted-foreground">
              Everybody holding this credential already meets it, so making it
              ongoing suspends nobody today.
            </p>
          ) : null}

          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
