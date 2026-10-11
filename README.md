# FreelancePay on Arc
A hackathon MVP for direct cross-border freelancer payments in USDC, with a minimal payment-link workspace and optional USDC → EURC conversion on Arc Testnet.

## Framework
This Lovable application uses **TanStack Start, React 19, TypeScript and Tailwind v4**, not Next.js. Pages are `/`, `/dashboard`, and `/pay`. Wallet interaction uses wagmi + viem and an injected EIP-1193 wallet (MetaMask or compatible). No WalletConnect project key is needed. Wallet private keys never enter the app.

## Run locally
```sh
bun install
cp .env.example .env.local
bun run dev
# npm run dev also works after dependencies are installed
```
Default configuration is Arc Testnet (chain 5042002). Set the public `VITE_` values in `.env.local` and restart development after changes. Published configuration requires a new publish. Arc uses native USDC with **18 decimals for gas**, but its ERC-20 interface uses **6 decimals**. Never mix them. EURC is also 6 decimals. Config defaults are in `src/lib/arc.ts`; replace the chain name, ID, RPC, explorer, token addresses and testnet flag together when switching networks. Do not assume these testnet contracts exist on mainnet.

Verified reference docs:
- https://docs.arc.io/arc/references/rpc-endpoints
- https://docs.arc.io/arc/references/contract-addresses
- https://developers.circle.com/stablecoins/eurc-contract-addresses
- https://developers.circle.com/stablefx/concepts/technical-guide

## Payment demo
1. With no connected wallet, the overview shows an explicitly labeled demo preview. Sample balances and sample activity are not onchain data. Generated sample links use a fixed sample wallet and should not be funded.
2. Install a browser wallet and connect. No connection is simulated. Switch/approve the Arc network when requested; acquire testnet USDC from https://faucet.circle.com.
3. Generate a link from your wallet with a positive USDC amount (at most six decimal places). Description is optional local form context; the minimal shared link carries recipient and amount only.
4. Open the link in a separate wallet/browser and pay. ERC-20 `transfer` sends directly to the recipient; USDC is also needed for gas. The app waits for a successful receipt and links to the explorer.
5. Refresh the recipient dashboard. Activity reads recent Transfer and vault FXConversion logs, bounded to the latest 10,000 blocks and 20 entries. Total received is the sum of this recent window, not an all-time accounting total. RPC providers may impose log limits; failures are surfaced without inventing activity. Balances refresh every 15 seconds.

## Conversion configuration and deployment
**StableFX is a permissioned institutional RFQ API and settlement system, not a generic permissionless `swap` function.** This MVP does not claim a live StableFX integration. Its vault supports a **Uniswap-V2-compatible DEX router** via `getAmountsOut` and `swapExactTokensForTokens`. Conversion is intentionally blocked until you configure a deployed vault.

1. Verify a real router contract on your selected Arc network: ABI compatibility, bytecode, permissions, and direct USDC/EURC liquidity. No speculative router is hardcoded.
2. Set `VITE_DEX_ROUTER_ADDRESS`, the two token addresses, and a funded local deployer's `DEPLOYER_PRIVATE_KEY` in `.env.local`. Never prefix a private key with `VITE_` or commit it.
3. Deploy with Node 22+:
```sh
node --env-file=.env.local scripts/deploy-vault.mjs
```
4. Copy the returned address into `VITE_VAULT_ADDRESS`, restart the app, and ensure the configured target matches the vault's immutable target.
5. The app requests exact USDC allowance if needed, waits for approval, calls `convertToLocalStablecoin`, then shows the output from its FXConversion event and the transaction hash.

The immutable router vault requires positive input, an immutable target, reentrancy protection, SafeERC20 transfers, and exact input/output balance checks. The caller signs `convertToLocalStablecoin(amountUSDC, targetStablecoin, minimumOut, deadline)`: minimum output must be positive and the deadline must be within five minutes. The app quotes the vault's immutable router after approval and sets a 99% minimum in signed calldata; it also checks the vault tokens match the app. Router-derived quotes are not independent price oracles and do not prevent all price manipulation. Redeploy older two-argument vaults before using this updated app.

`forwardUSDC(to, amount)` is optional for integrations needing `PaymentReceived` events. It requires an exact allowance and disallows zero, self, and vault recipients. The current payment page still uses direct ERC-20 `transfer`, so it needs no vault approval. Neither path charges a platform fee or creates escrow. The vault has no owner, upgrade mechanism, arbitrary token withdrawal, or rescue function; do not send tokens to it directly because unsolicited balances cannot be recovered.

The deployment script checks RPC chain ID, deployed bytecode, and six-decimal tokens before deployment. It cannot prove router safety or liquidity. This code is unaudited, testnet-only, and not suitable for real money. A verified liquid Arc router, funded deployer, and independent audit remain external prerequisites for production use.

## Structure
- `src/routes/`: Overview, dashboard, payment page, and shared root providers.
- `src/components/payments/`: Wallet state, navigation, and payment workspace.
- `src/lib/`: Arc configuration, wagmi configuration, payment validation and rule tests.
- `contracts/FreelancePayVault.sol`: Optional conversion and payment forwarding contract.
- `scripts/deploy-vault.mjs`: Local Solidity compilation and deployment.

## Checks
```sh
bun run test
node --test scripts/vault.test.mjs
```
The Solidity suite compiles the real vault and runs transactions on an isolated local EVM with mock stablecoins/router. It is not an Arc deployment or an audit.
No KYC, fiat off-ramp, custodial accounts, admin panel, or multi-chain support is included. Transactions are persisted onchain; no app database or browser-only payment history is required.
