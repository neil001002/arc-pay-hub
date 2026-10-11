import { createClientOnlyFn } from '@tanstack/react-start';
import { createPublicClient, type Address, type Hex } from 'viem';
import { createBundlerClient, toWebAuthnAccount } from 'viem/account-abstraction';
import { arcTestnet } from 'viem/chains';
import { circleClientKey, circleClientUrl, assertPasskeySupport } from './wallet-options';
import { circleUsernameError } from './circle-errors';

export const connectCircleWallet = createClientOnlyFn(async (register: boolean, username: string) => {
  if (!circleClientKey) throw new Error('Circle wallets are awaiting the Circle client key.');
  assertPasskeySupport(window.isSecureContext, typeof window.PublicKeyCredential !== 'undefined');
  const usernameError = register ? circleUsernameError(username) : null;
  if (usernameError) throw new Error(usernameError);
   // A dynamic import alone still enters the hosted server graph. The client-only
   // boundary removes this SDK import from server compilation entirely.
   const { toWebAuthnCredential, toPasskeyTransport, toModularTransport, toCircleSmartAccount, WebAuthnMode } = await import('@circle-fin/modular-wallets-core');
  const credential = await toWebAuthnCredential({
    transport: toPasskeyTransport(circleClientUrl, circleClientKey),
    mode: register ? WebAuthnMode.Register : WebAuthnMode.Login,
    ...(register ? { username: username.trim() } : {}),
  });
  // Circle's Arc bundler uses the chain-specific modular transport.
  const transport = toModularTransport(`${circleClientUrl}/arcTestnet`, circleClientKey);
  const client = createPublicClient({ chain: arcTestnet, transport });
  const account = await toCircleSmartAccount({ client, owner: toWebAuthnAccount({ credential }) });
  const bundler = createBundlerClient({ account, chain: arcTestnet, transport });
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