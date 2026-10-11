export const reownProjectId = import.meta.env["VITE_REOWN_PROJECT_ID"] ?? "";
// Circle Client Keys are public browser configuration, not private API keys.
// An environment value can override the project's testnet configuration.
export const circleClientKey =
  import.meta.env["VITE_CIRCLE_CLIENT_KEY"] || "8ba07feb9d7e1af3cc7d87c572028ed1:3b0015457b2d7c9700903cb4bf3b2d7a";
export const circleClientUrl = "https://modular-sdk.circle.com/v1/rpc/w3s/buidl";
export function assertPasskeySupport(secure: boolean, supported: boolean) {
  if (!secure || !supported) throw new Error("Circle wallets require a secure browser with passkey support.");
}
