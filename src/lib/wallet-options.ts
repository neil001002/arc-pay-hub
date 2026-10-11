export const reownProjectId = import.meta.env["VITE_REOWN_PROJECT_ID"] ?? "";
export function normalizeCircleClientKey(value: string): string {
  const key = value.trim();
  // Circle requires the complete Client Key, including its environment prefix.
  return /^[a-f0-9]{32}:[a-f0-9]{32}$/i.test(key) ? `TEST_CLIENT_KEY:${key}` : key;
}
// Circle Client Keys are public browser configuration, not private API keys.
// An environment value can override the project's testnet configuration.
export const circleClientKey =
  normalizeCircleClientKey(import.meta.env["VITE_CIRCLE_CLIENT_KEY"] || "TEST_CLIENT_KEY:8ba07feb9d7e1af3cc7d87c572028ed1:3b0015457b2d7c9700903cb4bf3b2d7a");
export const circleClientUrl = "https://modular-sdk.circle.com/v1/rpc/w3s/buidl";
export function assertPasskeySupport(secure: boolean, supported: boolean) {
  if (!secure || !supported) throw new Error("Circle wallets require a secure browser with passkey support.");
}
