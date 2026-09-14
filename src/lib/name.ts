/** Anything with a name on it, however much of one the caller happens to have. */
export interface Named {
  firstName: string;
  /** What they go by. Absent on payloads that predate it, and that is fine. */
  preferredFirstName?: string | null;
  lastName?: string;
}

/**
 * What to call somebody.
 *
 * The preferred name wherever there is one, because that is the point of
 * having the field: a member who has told us they go by Alex is Alex in the
 * roles list and on a token's owner line, not only on the page where they
 * typed it. The legal name is the subject in exactly one place — the member's
 * own record — and that is in the other portal.
 */
export function firstNameOf(person: Named): string {
  return person.preferredFirstName?.trim() || person.firstName;
}

/** "Alex Rivera" — the usual way a name appears in a sentence or a list. */
export function displayName(person: Named): string {
  return [firstNameOf(person), person.lastName].filter(Boolean).join(' ');
}

/** "Rivera, Alex" — for lists that sort by surname. */
export function surnameFirst(person: Named): string {
  return person.lastName
    ? `${person.lastName}, ${firstNameOf(person)}`
    : firstNameOf(person);
}

/**
 * Every spelling a search should match.
 *
 * Somebody looking for a member types whichever name they know: the one on
 * the certification card or the one on the radio. Both find them.
 */
export function searchableNames(person: Named): string[] {
  return [
    displayName(person),
    surnameFirst(person),
    person.firstName,
    person.preferredFirstName ?? '',
    person.lastName ?? '',
  ].filter(Boolean);
}
