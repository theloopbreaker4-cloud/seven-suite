/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  base32Decode,
  base32Encode,
  generateRecoveryCodes,
  generateTotpSecret,
  normalizeRecoveryCode,
  otpauthUrl,
  SecretBox,
  totpCode,
  totpStep,
  verifyTotp,
} from './totp';

// RFC 6238 appendix B, SHA-1 key "12345678901234567890" (6-digit = last 6 of the 8-digit values).
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('totp', () => {
  it('base32 round-trips', () => {
    expect(RFC_SECRET).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(base32Decode(RFC_SECRET).toString()).toBe('12345678901234567890');
    expect(base32Decode(generateTotpSecret())).toHaveLength(20);
  });

  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1234567890, '005924'],
    [2000000000, '279037'],
  ])('matches RFC 6238 at t=%i', (t, code) => {
    expect(totpCode(RFC_SECRET, totpStep(t * 1000))).toBe(code);
  });

  it('accepts ±1 step of drift and refuses reuse', () => {
    const now = 1111111109 * 1000;
    const step = totpStep(now);
    expect(
      verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 1), null, now),
    ).toBe(step - 1);
    expect(
      verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step + 1), null, now),
    ).toBe(step + 1);
    expect(
      verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 2), null, now),
    ).toBeNull();
    expect(verifyTotp(RFC_SECRET, '081804', step, now)).toBeNull(); // already used
    expect(verifyTotp(RFC_SECRET, '12345', null, now)).toBeNull();
  });

  it('builds an otpauth URL', () => {
    expect(otpauthUrl('ABC', 'a@b.c')).toBe(
      'otpauth://totp/Seven%20Suite%3Aa%40b.c?secret=ABC&issuer=Seven+Suite&algorithm=SHA1&digits=6&period=30',
    );
  });

  it('seals secrets so only the same key and context open them', () => {
    const box = new SecretBox('x'.repeat(48), 'totp');
    const sealed = box.seal('JBSWY3DPEHPK3PXP');
    expect(sealed).not.toContain('JBSWY3DPEHPK3PXP');
    expect(box.open(sealed)).toBe('JBSWY3DPEHPK3PXP');
    expect(() => new SecretBox('x'.repeat(48), 'other').open(sealed)).toThrow();
    const tampered = sealed.slice(0, -2) + (sealed.endsWith('A') ? 'BB' : 'AA');
    expect(() => box.open(tampered)).toThrow();
  });

  it('makes distinct, normalisable recovery codes', () => {
    const codes = generateRecoveryCodes();
    expect(new Set(codes).size).toBe(10);
    expect(codes[0]).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    expect(
      normalizeRecoveryCode(codes[0].toUpperCase().replace(/-/g, ' ')),
    ).toBe(codes[0]);
  });
});
