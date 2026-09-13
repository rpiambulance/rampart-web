/**
 * Display metadata for the API permission catalog (GET /v1/roles/permissions).
 * Enforcement lives entirely in the API; this is how the list reads to
 * whoever is deciding who gets what.
 *
 * Grouped the way the portal itself is arranged — members, then scheduling,
 * then training, then the operational things, then the keys to the building
 * — because somebody granting a permission is thinking about a job a person
 * does, not about a namespace prefix.
 *
 * Membership is listed rather than derived from prefixes. Two namespaces can
 * belong in one group (evaluations and checklists are one job), one
 * namespace can split across groups, and the order inside a group can then
 * run from reading to writing to the destructive things instead of
 * alphabetically, which put "delete" above "write".
 */

export interface PermissionGroup {
  label: string;
  /** What the group covers, for the heading to say. */
  blurb: string;
  permissions: string[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Members',
    blurb: 'The roster, and who may change it.',
    permissions: ['members:read', 'members:write', 'members:deactivate'],
  },
  {
    label: 'Night crews',
    blurb: 'Who is on which night, and the rules that decide it.',
    permissions: [
      'schedule:crews:assign',
      'schedule:crews:manage-defaults',
      'schedule:crews:duty-sup',
      'schedule:settings',
    ],
  },
  {
    label: 'Events & coverage',
    blurb: 'The calendar, and requests for cover from outside the agency.',
    permissions: [
      'events:create',
      'events:assign-others',
      'events:approve',
      'events:decline',
      'events:lock',
      'events:delete',
    ],
  },
  {
    label: 'Certifications & credentials',
    blurb:
      'Cards members hold, and the agency positions they are cleared for.',
    permissions: [
      'certs:read-all',
      'certs:verify',
      'credentials:grant',
      'credentials:appoint',
    ],
  },
  {
    label: 'Evaluations & checklists',
    blurb: 'Assessing members, and signing off what they have shown.',
    permissions: [
      'evals:write',
      'evals:read-all',
      'evals:manage-forms',
      'evals:delete-draft',
      'evals:delete-completed',
      'checklists:revoke-signoff',
    ],
  },
  {
    label: 'Promotions & training',
    blurb: 'Moving members up, and the training that gets them there.',
    permissions: [
      'promotions:review',
      'promotions:vote',
      'promotions:captain-approve',
      'promotions:adjust-requirements',
      'trainings:manage',
    ],
  },
  {
    label: 'Call operations',
    blurb:
      'Dispatches, run numbers, event standbys, and whether the agency is in service.',
    permissions: [
      'dispatches:read',
      'dispatches:write',
      'dispatches:ingest',
      'run-numbers:manage',
      'standbys:manage',
      'standbys:read-all',
      'service:status',
    ],
  },
  {
    label: 'Station & equipment',
    blurb: 'The building, the fleet, and the checks that keep them ready.',
    permissions: [
      'checksheets:read-all',
      'checksheets:manage',
      'chores:manage',
      'fuel:write',
      'radios:manage',
      'vehicles:manage',
      'headsup:manage',
    ],
  },
  {
    label: 'Configuration',
    blurb: 'Settings the rest of the portal is built out of.',
    permissions: [
      'settings:write',
      'resources:manage',
      'integrations:manage',
      'system:migrate-legacy',
    ],
  },
  {
    label: 'Access & audit',
    blurb: 'Who can do what, and the record of what was done.',
    permissions: ['roles:manage', 'tokens:manage', 'audit:read'],
  },
];

export const PERMISSION_INFO: Record<string, string> = {
  // Members
  'members:read': 'View the member directory and member profiles',
  'members:write': 'Create members and edit member records',
  'members:deactivate': 'Deactivate members, and bring them back',

  // Night crews
  'schedule:crews:assign':
    'Put members on night crews and take them off, overriding the signup rules',
  'schedule:crews:manage-defaults':
    'Edit the weekly default crew, and mark a weekday as one the agency does not run',
  'schedule:crews:duty-sup':
    'Take the duty supervisor seat without holding the DS credential',
  'schedule:settings':
    'Change the scheduling rules: signup opening times, the rotation window, minimum age',

  // Events & coverage
  'events:create': 'Create and edit events, and see who is available for one',
  'events:assign-others': 'Sign other members up to events, and remove them',
  'events:approve': 'Approve a coverage request and publish the event',
  'events:decline': 'Decline a coverage request',
  'events:lock': 'Lock an event so members can no longer sign themselves up',
  'events:delete':
    'Delete an event outright. Held apart from creating one — an event carries its signups, and possibly a whole standby',

  // Event standbys
  'standbys:manage':
    'Open and run an event standby: personnel, units, and the record as a whole. Writing up an encounter needs only being on the standby',
  'standbys:read-all':
    'Read every encounter from every standby. A supervisor already sees the encounters on a standby they are working; this is for whoever answers for one they did not',

  // Certifications & credentials
  'certs:read-all': "View any member's certifications and the expiring report",
  'certs:verify':
    'Approve or reject submitted certifications, and view the documents attached to them',
  'credentials:grant':
    'Grant and suspend agency credentials — crew chief, driver, attendant',
  'credentials:appoint':
    'Make the appointments the ladder does not cover, from duty supervisor up to captain',

  // Evaluations & checklists
  'evals:write': 'Fill in an evaluation of another member',
  'evals:read-all': "Read any member's evaluations, not only your own",
  'evals:manage-forms': 'Build and edit the evaluation and checklist templates',
  'evals:delete-draft':
    'Throw away an evaluation still in draft, which nobody has been told about',
  'evals:delete-completed':
    'Erase an evaluation that has been submitted or signed. Held separately from deleting a draft',
  'checklists:revoke-signoff':
    'Withdraw a checklist sign-off somebody else made. Signers may always withdraw their own',

  // Promotions & training
  'promotions:review': 'Read the promotion review queue and a candidate’s file',
  'promotions:vote': 'Vote on a promotion at the Training Committee',
  'promotions:captain-approve': 'Give the captain’s approval to a promotion',
  'promotions:adjust-requirements':
    'Waive or add a requirement for one candidate, and record why',
  'trainings:manage':
    'Create annual trainings and classes, and record who attended',

  // Call operations
  'dispatches:read': 'View the dispatch log',
  'dispatches:write':
    'Add a dispatch by hand, for a call the Herald feed never delivered',
  'dispatches:ingest':
    'Accept dispatches from the Herald feed. For machine tokens — not something a person needs',
  'run-numbers:manage':
    'Edit standby locations and their run-number counters. Issuing a number needs nothing',
  'service:status': 'Put the agency in or out of service',

  // Station & equipment
  'checksheets:read-all':
    'Read every completed checksheet, the open deficiencies and the expiry report. Everyone can read back their own',
  'checksheets:manage':
    'Build checksheets and keep the list of assets they are filled in against. Completing one needs nothing',
  'chores:manage': 'Create and edit chores, and reopen completed ones',
  'fuel:write': 'Add fuel log entries',
  'radios:manage': 'Manage radio inventory, and issue and return radios',
  'vehicles:manage': 'Manage the fleet vehicles the fuel log and checksheets use',
  'headsup:manage':
    'Hand out and revoke the links that open a Heads Up display, and start its counters again. Writing on the board needs nothing',

  // Configuration
  'settings:write':
    'Edit app settings: certification types, event kinds and tiers, credential requirements',
  'resources:manage': 'Edit the shared list of links on the Resources page',
  'integrations:manage':
    'Configure Slack, the calendar feed and the outgoing webhooks',
  'system:migrate-legacy':
    'Run the one-shot import from the legacy MySQL portal. Destructive, and meant to be used once',

  // Access & audit
  'roles:manage':
    'Create and edit roles, assign them to members, and link roles to credentials',
  'tokens:manage': 'Create and revoke API tokens',
  'audit:read': 'Read the audit log: decisions, page loads and API calls',
};

const GROUP_OF = new Map<string, string>(
  PERMISSION_GROUPS.flatMap((group) =>
    group.permissions.map((permission) => [permission, group.label] as const),
  ),
);

/**
 * Anything the API grows that this file has not been told about.
 *
 * Shown rather than hidden: a permission nobody can find is a permission
 * nobody grants, and the bug is here rather than in the catalog.
 */
export const UNGROUPED = 'Not yet categorised';

export function permissionGroup(permission: string): string {
  return GROUP_OF.get(permission) ?? UNGROUPED;
}

export const GROUP_ORDER = [
  ...PERMISSION_GROUPS.map((group) => group.label),
  UNGROUPED,
];

export function groupBlurb(label: string): string | undefined {
  return PERMISSION_GROUPS.find((group) => group.label === label)?.blurb;
}

/**
 * The catalog, arranged.
 *
 * Only what the API actually returned is shown, so a permission removed from
 * the catalog stops appearing here without anybody editing this file.
 */
export function groupPermissions(
  catalog: string[],
): Array<{ group: string; blurb?: string; permissions: string[] }> {
  const held = new Set(catalog);
  const out: Array<{ group: string; blurb?: string; permissions: string[] }> =
    PERMISSION_GROUPS.map((group) => ({
    group: group.label,
    blurb: group.blurb,
    permissions: group.permissions.filter((permission) => held.has(permission)),
  })).filter((group) => group.permissions.length);

  const loose = catalog.filter((permission) => !GROUP_OF.has(permission)).sort();
  if (loose.length) out.push({ group: UNGROUPED, permissions: loose });
  return out;
}
