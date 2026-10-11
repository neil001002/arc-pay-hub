import { describe, expect, it } from 'vitest';
import { assertPasskeySupport } from './wallet-options';
describe('Circle passkey requirements', () => {
  it('rejects an insecure origin', () => expect(() => assertPasskeySupport(false, true)).toThrow());
  it('rejects browsers without passkeys', () => expect(() => assertPasskeySupport(true, false)).toThrow());
  it('accepts secure passkey-capable browsers', () => expect(() => assertPasskeySupport(true, true)).not.toThrow());
});