import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createAppKit } from '@reown/appkit/react';
import { arc } from './arc';
import { reownProjectId } from './wallet-options';

export function createWalletKit() {
  if (!reownProjectId) return null;
  const adapter = new WagmiAdapter({ networks: [arc], projectId: reownProjectId, ssr: true });
  const kit = createAppKit({
    adapters: [adapter], networks: [arc], defaultNetwork: arc, projectId: reownProjectId,
    metadata: { name: 'FreelancePay on Arc', description: 'Freelancer USDC payments on Arc Testnet', url: window.location.origin, icons: [`${window.location.origin}/favicon.svg`] },
    features: { analytics: false, email: false, socials: false, swaps: false, onramp: false },
    enableNetworkSwitch: false,
  });
  return { config: adapter.wagmiConfig, open: () => kit.open({ view: 'Connect' }) };
}