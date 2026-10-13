import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { arcMainnet, arcTestnet } from "./arc";
import { reownProjectId } from "./wallet-options";

export function createWalletKit() {
  if (!reownProjectId) return null;
  // AppKit's interface marks these optional, while its adapter explicitly includes undefined.
  const adapter = Object.assign(
    new WagmiAdapter({
      networks: [arcMainnet, arcTestnet],
      projectId: reownProjectId,
      ssr: true,
      connectors: [
        walletConnect({ projectId: reownProjectId, showQrModal: false }),
        injected({ shimDisconnect: true }),
      ],
    }),
    { namespace: "eip155" as const, adapterType: "wagmi" },
  );
  const kit = createAppKit({
    adapters: [adapter],
    networks: [arcMainnet, arcTestnet],
    defaultNetwork: arcMainnet,
    projectId: reownProjectId,
    metadata: {
      name: "FreelancePay on Arc",
      description: "Freelancer USDC payments on Arc",
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.svg`],
    },
    features: { analytics: false, email: false, socials: false, swaps: false, onramp: false },
    enableNetworkSwitch: true,
  });
  return { config: adapter.wagmiConfig, open: () => kit.open({ view: "Connect" }) };
}
