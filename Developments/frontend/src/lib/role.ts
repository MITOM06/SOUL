// Utility functions related to user roles.
// This helper normalizes various role structures from the backend into a simple
// string union: 'admin', 'user' or 'guest'.  It accepts any object and
// inspects common patterns such as a string role, a boolean `is_admin`,
// an array of roles or a numeric `role_id`.  If none match it falls back
// to 'user' for authenticated users or 'guest' for unauthenticated states.
export type NormalizedRole = 'admin' | 'user' | 'guest';

export function normalizeRole(u: any): NormalizedRole {
  if (!u) return 'guest';

  // 1) Raw string role
  if (typeof u.role === 'string' && u.role.trim()) {
    return u.role.toLowerCase() === 'admin' ? 'admin' : 'user';
  }

  // 2) Boolean flag
  if (u.is_admin === true) return 'admin';

  // 3) Array of roles (e.g. Spatie permission returns array of objects or strings)
  if (Array.isArray(u.roles) && u.roles.length > 0) {
    const first = u.roles[0];
    if (typeof first === 'string') {
      return first.toLowerCase() === 'admin' ? 'admin' : 'user';
    }
    if (first && typeof first.name === 'string') {
      return first.name.toLowerCase() === 'admin' ? 'admin' : 'user';
    }
  }

  // 4) Numeric role id convention: 1 = admin
  if (typeof u.role_id === 'number') {
    return u.role_id === 1 ? 'admin' : 'user';
  }

  return 'user';
}
