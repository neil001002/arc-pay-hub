<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Keep TanStack Start file routes and TypeScript instead of Next.js; the hosted runtime supports this framework.
- Use wagmi with an injected browser wallet and viem for Arc ERC-20 balances, transactions, and event reads; payments are persisted onchain without an app database.
- Keep demo activity explicitly labeled and separate from connected-wallet onchain reads; sample data must never be presented as real funds or confirmations.
- Place Arc public configuration and ABIs in shared browser-safe modules; private deployer keys belong only to local deployment scripts.
- Use a deployed vault with a configured Uniswap-V2-compatible router for conversions; StableFX is a permissioned RFQ service, not a generic swap router.
- Keep conversion minimum output and expiry in caller-signed calldata; immutable token/router configuration and exact balance checks prevent silent underdelivery.
- Compile and exercise Solidity through local-only solc and Ganache tooling; never import deployment or test tooling into the app runtime.
