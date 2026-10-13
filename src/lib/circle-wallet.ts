import { createClientOnlyFn } from '@tanstack/react-start';
import { createPublicClient, type Address, type Hex } from 'viem';
import { createBundlerClient, toWebAuthnAccount } from 'viem/account-abstraction';
import { arcMainnet, arcTestnet } from './arc';
import { circleKeyFor, circleChainPath, circleClientUrl, assertPasskeySupport } from './wallet-options';
import { circleUsernameError } from './circle-errors';

// Dynamic imports are moved to the top level but still inside the client-only boundary context
// to ensure they are available immediately when the function is called, preserving the user gesture.
const getSDK = async () => {
  return import('@circle-fin/modular-wallets-core');
};

export const connectCircleWallet = createClientOnlyFn(async (register: boolean, username: string, network: 'mainnet' | 'testnet' = 'testnet') => {
  const circleClientKey = circleKeyFor(network);
  const chain = network === 'mainnet' ? arcMainnet : arcTestnet;
  if (!circleClientKey) throw new Error(network === 'mainnet' ? 'Circle wallets on Arc Mainnet are waiting for a production Client Key. Use an external wallet or switch to Arc Testnet for now.' : 'Circle wallets are awaiting the Circle client key.');
  assertPasskeySupport(window.isSecureContext, typeof window.PublicKeyCredential !== 'undefined');
  const usernameError = register ? circleUsernameError(username) : null;
  if (usernameError) throw new Error(usernameError);
  
  const { toWebAuthnCredential, toPasskeyTransport, toModularTransport, toCircleSmartAccount, WebAuthnMode } = await getSDK();
  
  const credential = await toWebAuthnCredential({
    transport: toPasskeyTransport(circleClientUrl, circleClientKey),
    mode: register ? WebAuthnMode.Register : WebAuthnMode.Login,
    ...(register ? { username: username.trim() } : {}),
  });
  // Circle's Arc bundler uses the chain-specific modular transport.
  const transport = toModularTransport(`${circleClientUrl}/${circleChainPath[network]}`, circleClientKey);
  const client = createPublicClient({ chain, transport });
  const account = await toCircleSmartAccount({ client, owner: toWebAuthnAccount({ credential }) });
  const bundler = createBundlerClient({ account, chain, transport });
  return {
    address: account.address,
    async sendCall(to: Address, data: Hex): Promise<Hex> {
      const hash = await bundler.sendUserOperation({ calls: [{ to, data }], paymaster: true });
      const receipt = await bundler.waitForUserOperationReceipt({ hash });
      if (!receipt.success || receipt.receipt.status !== 'success') throw new Error('Circle wallet transaction failed.');
      return receipt.receipt.transactionHash;
    },
  };
});
export type CircleWallet = Awaited<ReturnType<typeof connectCircleWallet>>;
