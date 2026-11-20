/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { isReservedRecipient } from './mail.service';

describe('isReservedRecipient', () => {
  it('flags RFC 2606 / 6761 names', () => {
    for (const a of [
      'a@example.com',
      'b@mail.example.org',
      'c@shop.test',
      'd@x.invalid',
      'e@host.localhost',
      'f@foo.example',
    ]) {
      expect(isReservedRecipient(a)).toBe(true);
    }
  });
  it('lets real addresses through', () => {
    for (const a of [
      'a@gmail.com',
      'b@toolpix.dev',
      'c@notexample.com',
      'd@example.com.ge',
    ]) {
      expect(isReservedRecipient(a)).toBe(false);
    }
  });
});
