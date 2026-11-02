import { INPUT_CLS as inputCls, type Requirement } from './types';

/** "Oct 1, 2026" from a date-only value. */
function shortDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * The dates on a requirement, in a line: when it applies, what counts, and
 * when what counts runs out. Empty when it has none.
 */
export function requirementDatesSummary(req: Requirement): string {
  const parts: string[] = [];
  if (req.effectiveFrom && req.effectiveUntil) {
    parts.push(`${shortDate(req.effectiveFrom)} – ${shortDate(req.effectiveUntil)}`);
  } else if (req.effectiveFrom) {
    parts.push(`from ${shortDate(req.effectiveFrom)}`);
  } else if (req.effectiveUntil) {
    parts.push(`until ${shortDate(req.effectiveUntil)}`);
  }
  if (req.countsFrom) parts.push(`counts if done ${shortDate(req.countsFrom)} on`);
  if (req.validThrough) parts.push(`good through ${shortDate(req.validThrough)}`);
  if (req.classSeries?.validityMonths) {
    parts.push(`each session lasts ${req.classSeries.validityMonths} mo`);
  }
  return parts.join(' · ');
}

const FIELDS: Array<{
  name: 'effectiveFrom' | 'effectiveUntil' | 'countsFrom' | 'validThrough';
  label: string;
  title: string;
}> = [
  {
    name: 'effectiveFrom',
    label: 'In force from',
    title:
      'Suspends nobody for anything before this day. Holders who have not met it are reminded 14 and 3 days ahead.',
  },
  {
    name: 'effectiveUntil',
    label: 'In force until',
    title:
      'The last day it applies — the end of a season. Anybody suspended only for it gets the credential back after.',
  },
  {
    name: 'countsFrom',
    label: 'Counts if done on or after',
    title:
      'Anything older does not count — last season’s flu shot is not this season’s. Not used for a single class.',
  },
  {
    name: 'validThrough',
    label: 'Good through (renewal cycle)',
    title:
      'Nothing counts past this day, for everybody, and the requirement carries on — set the next cycle’s dates before it passes. Officers are reminded 30 and 7 days ahead.',
  },
];

/**
 * The four dates a requirement can carry, as form fields.
 *
 * Two say when it applies at all (a season), two say what meets it (only
 * this season's, only this cycle's). All optional: a requirement with none
 * applies from now on, to anything on record.
 */
export function RequirementDateFields({ req }: { req?: Requirement }) {
  return (
    <>
      {FIELDS.map((field) => (
        <label key={field.name} className="grid gap-1 text-xs text-muted-foreground">
          {field.label} (optional)
          <input
            type="date"
            name={field.name}
            title={field.title}
            defaultValue={req?.[field.name]?.slice(0, 10) ?? ''}
            className={inputCls}
          />
        </label>
      ))}
    </>
  );
}
