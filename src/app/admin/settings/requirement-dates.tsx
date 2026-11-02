import type { Requirement } from './types';

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
