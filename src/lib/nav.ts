/**
 * Admin-console navigation. This app is system administration only —
 * the member portal (scheduling, events, training, personnel) lives in
 * the `central` app.
 *
 * `permissions` = show the item when the member holds ANY of the listed
 * permissions. The console itself requires at least one CONSOLE_PERMISSION
 * to enter (see NavShell).
 */
export interface NavItem {
  href: string;
  label: string;
  permissions?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const CONSOLE_PERMISSIONS = [
  'system:migrate-legacy',
  'tokens:manage',
  'roles:manage',
  'settings:write',
  'schedule:settings',
  'vehicles:manage',
  'audit:read',
  'integrations:manage',
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Administration',
    items: [
      { href: '/admin/tokens', label: 'API Tokens', permissions: ['tokens:manage'] },
      {
        href: '/admin/webhooks',
        label: 'Webhooks',
        permissions: ['integrations:manage'],
      },
      { href: '/admin/roles', label: 'Roles & Permissions', permissions: ['roles:manage'] },
      { href: '/admin/vehicles', label: 'Vehicles', permissions: ['vehicles:manage'] },
      { href: '/admin/audit', label: 'Audit Log', permissions: ['audit:read'] },
    ],
  },
  {
    // One page per subject rather than a single scroll of every card. The
    // legacy import is deliberately absent: it is a one-shot job that has
    // been done, and a live link to it is an invitation to run it again.
    label: 'Settings',
    items: [
      {
        href: '/admin/settings/messaging',
        label: 'Messaging',
        permissions: ['settings:write'],
      },
      {
        href: '/admin/settings/scheduling',
        label: 'Scheduling',
        permissions: ['schedule:settings', 'settings:write'],
      },
      {
        href: '/admin/settings/credentials',
        label: 'Credentials',
        permissions: ['settings:write'],
      },
      {
        href: '/admin/settings/certifications',
        label: 'Certifications',
        permissions: ['settings:write'],
      },
      {
        href: '/admin/settings/events',
        label: 'Events',
        permissions: ['settings:write'],
      },
    ],
  },
];

/** Groups visible to a member holding `permissions`; empty groups drop out. */
export function filterNavGroups(permissions: Set<string>): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter(
      (item) =>
        !item.permissions ||
        item.permissions.some((permission) => permissions.has(permission)),
    ),
  })).filter((group) => group.items.length > 0);
}

export function hasConsoleAccess(permissions: Set<string>): boolean {
  return CONSOLE_PERMISSIONS.some((permission) => permissions.has(permission));
}
