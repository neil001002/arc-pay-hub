import { describe, expect, it, vi } from 'vitest';

vi.mock('@circle-fin/modular-wallets-core', () => {
  throw new Error('Circle SDK must not execute when the wallet module is imported');
});

describe('Circle wallet module boundary', () => {
  it('can be imported without evaluating the browser wallet SDK', async () => {
    const walletModule = await import('./circle-wallet');
    expect(typeof walletModule.connectCircleWallet).toBe('function');
  });
});