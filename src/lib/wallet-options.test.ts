import { describe, expect, it } from 'vitest';
import { assertPasskeySupport, circleClientKey, normalizeCircleClientKey } from './wallet-options';
describe('Circle test client key format', () => {
  it('restores the missing test environment prefix for an Arc test key', () => {
    const value = `${'a'.repeat(32)}:${'b'.repeat(32)}`;
    expect(normalizeCircleClientKey(value)).toBe(`TEST_CLIENT_KEY:${value}`);
  });
  it('preserves the full environment prefix', () => {
    expect(normalizeCircleClientKey(' TEST_CLIENT_KEY:example ')).toBe('TEST_CLIENT_KEY:example');
  });
  it('configures a complete test client key', () => {
    expect(/^TEST_CLIENT_KEY:[a-f0-9]{32}:[a-f0-9]{32}$/i.test(circleClientKey)).toBe(true);
  });
});
describe('Circle passkey requirements', () => {
  it('rejects an insecure origin', () => expect(() => assertPasskeySupport(false, true)).toThrow());
  it('rejects browsers without passkeys', () => expect(() => assertPasskeySupport(true, false)).toThrow());
  it('accepts secure passkey-capable browsers', () => expect(() => assertPasskeySupport(true, true)).not.toThrow());
});