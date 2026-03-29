import type { Role } from '../types';

const KNOWN_ROLES: Role[] = ['admin', 'admission_officer', 'management'];

/** Ensures UI only trusts roles the app understands (must match backend `User.role`). */
export function parseRoleFromApi(value: unknown): Role | null {
  if (typeof value !== 'string') return null;
  return KNOWN_ROLES.includes(value as Role) ? (value as Role) : null;
}
