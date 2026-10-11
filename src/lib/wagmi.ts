import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { arc } from './arc';
export const walletConfig = createConfig({ chains:[arc], connectors:[injected()], transports:{[arc.id]:http()}, ssr:true });
let kitPromise: Promise<ReturnType<typeof import('./appkit').createWalletKit>> | undefined;
export function initializeAppKit() {
  kitPromise ??= import('./appkit').then(module => module.createWalletKit());
  return kitPromise;
}
export async function openAppKit() {
  const kit = await initializeAppKit();
  if (!kit) throw new Error('AppKit is awaiting the Reown project ID.');
  await kit.open();
}
