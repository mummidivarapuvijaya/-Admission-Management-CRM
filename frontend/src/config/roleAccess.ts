import type { Role } from '../types';

/** Route paths and which JWT roles may open them (kept in sync with API `requireRoles` / `requireDbRole`). */
export const ROUTE_ACCESS: Record<string, readonly Role[]> = {
  '/app/dashboard': ['admin', 'admission_officer', 'management'],
  '/app/masters': ['admin'],
  '/app/intakes': ['admin'],
  '/app/applicants': ['admission_officer'],
  '/app/allocation': ['admission_officer'],
  '/app/admission-confirmed': ['admission_officer'],
} as const;

export type AppPath = keyof typeof ROUTE_ACCESS;

export function rolesAllowedForPath(path: string): readonly Role[] {
  return ROUTE_ACCESS[path as AppPath] ?? [];
}

export function roleMayAccessPath(role: Role, path: string): boolean {
  const allowed = rolesAllowedForPath(path);
  return allowed.includes(role);
}

export const NAV_DEFINITIONS: ReadonlyArray<{
  path: AppPath;
  label: string;
  iconKey: 'dashboard' | 'masters' | 'intakes' | 'applicants' | 'allocation';
  roles: readonly Role[];
}> = [
  { path: '/app/dashboard', label: 'Dashboard', iconKey: 'dashboard', roles: ['admin', 'admission_officer', 'management'] },
  { path: '/app/masters', label: 'Master setup', iconKey: 'masters', roles: ['admin'] },
  { path: '/app/intakes', label: 'Seat matrix & quotas', iconKey: 'intakes', roles: ['admin'] },
  { path: '/app/applicants', label: 'Applicants', iconKey: 'applicants', roles: ['admission_officer'] },
  { path: '/app/allocation', label: 'Seat allocation', iconKey: 'allocation', roles: ['admission_officer'] },
];

export function navItemsForRole(role: Role) {
  return NAV_DEFINITIONS.filter((item) => item.roles.includes(role));
}

export function defaultHomePathForRole(role: Role): string {
  if (role === 'management') return '/app/dashboard';
  if (role === 'admin') return '/app/masters';
  return '/app/applicants';
}
