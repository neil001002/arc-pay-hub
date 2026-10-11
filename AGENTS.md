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
- Keep wallet context identity in a separate non-component module; component hot updates must not replace the context shared by the provider and its consumers.
- Keep TanStack Start file routes and TypeScript instead of Next.js; the hosted runtime supports this framework.
- Use Reown AppKit's wagmi adapter for external wallets, with injected fallback when unconfigured; use Circle modular passkey wallets for embedded accounts, so users retain custody and payments remain onchain without an app database.
- Keep public wallet-provider configuration in the browser-safe wallet options module with environment overrides; never place private provider API keys there.
- Validate Circle registration usernames and classify provider errors in a shared browser-safe helper; distinguish username failures from setup failures without exposing raw provider responses.
- Load AppKit and Circle SDKs inside createClientOnlyFn boundaries after hydration or user action; dynamic imports alone still enter the hosted server graph and can break page loading.
- Route Circle contract calls through sponsored user operations and verify both user-operation success and transaction receipts; external wallets keep wagmi signing and both share viem reads.
- Resolve wallet SDKs to a single viem version through dependency overrides; duplicate versions create incompatible account and transport types.
- Keep demo activity explicitly labeled and separate from connected-wallet onchain reads; sample data must never be presented as real funds or confirmations.
- Place Arc public configuration and ABIs in shared browser-safe modules; private deployer keys belong only to local deployment scripts.
- Use a deployed vault with a configured Uniswap-V2-compatible router for conversions; StableFX is a permissioned RFQ service, not a generic swap router.
- Keep conversion minimum output and expiry in caller-signed calldata; immutable token/router configuration and exact balance checks prevent silent underdelivery.
- Compile and exercise Solidity through local-only solc and Ganache tooling; never import deployment or test tooling into the app runtime.
