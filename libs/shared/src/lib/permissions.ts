/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */

/**
 * Permissions are `module:entity:action` strings (`crm:deal:write`). A granted permission
 * may use `*` for a whole segment and everything after it: `*` (everything), `crm:*`
 * (all of CRM), `crm:deal:*` (every action on deals).
 *
 * Shared by the API (enforcement) and the admin (hiding what you can't do).
 */
export function hasPermission(granted: readonly string[], required: string): boolean {
  const need = required.split(':');
  return granted.some((g) => {
    const have = g.split(':');
    for (let i = 0; i < have.length; i++) {
      if (have[i] === '*') return true;
      if (have[i] !== need[i]) return false;
    }
    return have.length === need.length;
  });
}

/**
 * Every concrete permission the product checks, for pickers (roles, API keys). Modules append
 * theirs as they land; the API stays the source of truth for enforcement.
 */
export const PERMISSION_CATALOG: readonly { key: string; group: string }[] = [
  { key: 'platform:member:read', group: 'platform' },
  { key: 'platform:member:invite', group: 'platform' },
  { key: 'platform:member:update', group: 'platform' },
  { key: 'platform:member:remove', group: 'platform' },
  { key: 'platform:role:create', group: 'platform' },
  { key: 'platform:role:update', group: 'platform' },
  { key: 'platform:role:delete', group: 'platform' },
  { key: 'platform:settings:read', group: 'platform' },
  { key: 'platform:settings:update', group: 'platform' },
  { key: 'platform:api_key:read', group: 'platform' },
  { key: 'platform:api_key:create', group: 'platform' },
  { key: 'platform:api_key:delete', group: 'platform' },
];
