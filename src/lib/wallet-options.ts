export const reownProjectId = import.meta.env['VITE_REOWN_PROJECT_ID'] ?? '';
export const circleClientKey = import.meta.env['VITE_CIRCLE_CLIENT_KEY'] ?? '';
export const circleClientUrl = 'https://modular-sdk.circle.com/v1/rpc/w3s/buidl';
export function assertPasskeySupport(secure: boolean, supported: boolean) {
  if (!secure || !supported) throw new Error('Circle wallets require a secure browser with passkey support.');
}