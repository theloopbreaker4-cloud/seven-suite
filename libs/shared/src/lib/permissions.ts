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
