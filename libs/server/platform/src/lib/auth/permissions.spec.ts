/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { hasPermission } from './permissions';

describe('hasPermission', () => {
  it('matches exact permissions only', () => {
    expect(hasPermission(['crm:deal:read'], 'crm:deal:read')).toBe(true);
    expect(hasPermission(['crm:deal:read'], 'crm:deal:write')).toBe(false);
    expect(hasPermission(['crm:deal'], 'crm:deal:read')).toBe(false);
  });

  it('expands wildcards from their position', () => {
    expect(hasPermission(['*'], 'billing:invoice:void')).toBe(true);
    expect(hasPermission(['crm:*'], 'crm:lead:delete')).toBe(true);
    expect(hasPermission(['crm:*'], 'billing:invoice:read')).toBe(false);
    expect(hasPermission(['crm:deal:*'], 'crm:deal:write')).toBe(true);
    expect(hasPermission(['crm:deal:*'], 'crm:lead:write')).toBe(false);
  });

  it('denies with no grants', () => {
    expect(hasPermission([], 'crm:deal:read')).toBe(false);
  });
});
