import { toWebAuthnCredential, toPasskeyTransport, toModularTransport, toCircleSmartAccount, WebAuthnMode } from '@circle-fin/modular-wallets-core';
import { createPublicClient, type Address, type Hex } from 'viem';
import { createBundlerClient, toWebAuthnAccount } from 'viem/account-abstraction';
import { arcTestnet } from 'viem/chains';
import { circleClientKey, circleClientUrl, assertPasskeySupport } from './wallet-options';

export async function connectCircleWallet(register: boolean, username: string) {
  if (!circleClientKey) throw new Error('Circle wallets are awaiting the Circle client key.');
  assertPasskeySupport(window.isSecureContext, typeof window.PublicKeyCredential !== 'undefined');
  if (register && !username.trim()) throw new Error('Enter a name for your passkey.');
  const credential = await toWebAuthnCredential({
    transport: toPasskeyTransport(circleClientUrl, circleClientKey),
    mode: register ? WebAuthnMode.Register : WebAuthnMode.Login,
    ...(register ? { username: username.trim() } : {}),
  });
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
}
export type CircleWallet = Awaited<ReturnType<typeof connectCircleWallet>>;