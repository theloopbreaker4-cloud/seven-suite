/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */

import { hasPermission } from '@seven/shared';

export { hasPermission };

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
