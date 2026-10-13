import { describe, expect, it } from 'vitest';
import { arcNetworks, usdc } from './arc';
describe('Arc networks', () => {
  it('uses chain 5042 for Arc Mainnet', () => { expect(arcNetworks.mainnet.chain.id).toBe(5042); expect(arcNetworks.mainnet.chain.rpcUrls.default.http[0]).toBe('https://rpc.mainnet.arc.io'); });
  it('uses chain 5042002 for Arc Testnet', () => { expect(arcNetworks.testnet.chain.id).toBe(5042002); });
  it('uses the shared USDC system address', () => { expect(usdc).toBe('0x3600000000000000000000000000000000000000'); });
  it('keeps Circle passkeys testnet-only', () => { expect(arcNetworks.mainnet.circle).toBe(false); expect(arcNetworks.testnet.circle).toBe(true); });
});
