/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  needsRehash,
  verifyPassword,
} from './password';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash.startsWith('scrypt$32768$8$1$')).toBe(true);
    await expect(
      verifyPassword('correct horse battery staple', hash),
    ).resolves.toBe(true);
    await expect(
      verifyPassword('Correct horse battery staple', hash),
    ).resolves.toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('treats unicode-equivalent input as the same password', async () => {
    const hash = await hashPassword('café');
    await expect(verifyPassword('café', hash)).resolves.toBe(true);
  });

  it('rejects malformed hashes instead of throwing', async () => {
    await expect(verifyPassword('x', 'not-a-hash')).resolves.toBe(false);
    await expect(verifyPassword('x', DUMMY_PASSWORD_HASH)).resolves.toBe(false);
  });

  it('flags weaker parameters for rehash', () => {
    expect(needsRehash('scrypt$16384$8$1$a$b')).toBe(true);
    expect(needsRehash('scrypt$32768$8$1$a$b')).toBe(false);
  });
});
