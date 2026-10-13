import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { createClientOnlyFn } from '@tanstack/react-start';
import { arcMainnet, arcTestnet } from './arc';
export const walletConfig = createConfig({ chains:[arcTestnet, arcMainnet], connectors:[injected()], transports:{[arcTestnet.id]:http(),[arcMainnet.id]:http()}, ssr:true });
let kitPromise: Promise<ReturnType<typeof import('./appkit').createWalletKit>> | undefined;
export const initializeAppKit = createClientOnlyFn(() => {
  kitPromise ??= import('./appkit').then(module => module.createWalletKit());
  return kitPromise;
});
export async function openAppKit() {
  const kit = await initializeAppKit();
  if (!kit) throw new Error('AppKit is awaiting the Reown project ID.');
  await kit.open();
}
