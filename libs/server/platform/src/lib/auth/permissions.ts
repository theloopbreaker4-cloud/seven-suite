/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */

/**
 * Permissions are `module:entity:action` strings (`crm:deal:write`). A granted permission
 * may use `*` for a whole segment and everything after it: `*` (everything), `crm:*`
 * (all of CRM), `crm:deal:*` (every action on deals).
 */
export function hasPermission(
  granted: readonly string[],
  required: string,
): boolean {
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

export interface SystemRole {
  key: string;
  name: string;
  permissions: string[];
}

/** Roles every new organization starts with. Owners can't be locked out; admins manage people. */
export const SYSTEM_ROLES: readonly SystemRole[] = [
  { key: 'owner', name: 'Owner', permissions: ['*'] },
  {
    key: 'admin',
    name: 'Administrator',
    permissions: [
      'platform:member:*',
      'platform:role:*',
      'platform:settings:*',
      'platform:api_key:*',
    ],
  },
  { key: 'member', name: 'Member', permissions: ['platform:member:read'] },
];
