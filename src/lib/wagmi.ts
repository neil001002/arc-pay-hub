import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { arc } from './arc';
export const walletConfig = createConfig({ chains:[arc], connectors:[injected()], transports:{[arc.id]:http()}, ssr:true });
