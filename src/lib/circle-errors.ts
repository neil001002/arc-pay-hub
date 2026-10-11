function matchesCircleError(error: unknown, matches: (details: { message?: unknown; details?: unknown; status?: unknown; code?: unknown }) => boolean): boolean {
  const visited = new Set<unknown>();
  let current = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const details = current as { message?: unknown; details?: unknown; status?: unknown; code?: unknown; cause?: unknown };
    if (matches(details)) return true;
    current = details.cause;
  }
  return false;
}

export function isCircleCredentialError(error: unknown): boolean {
  return matchesCircleError(error, details => details.status === 401 || [details.message, details.details].some(value =>
    typeof value === 'string' && /invalid credentials|unauthorized/i.test(value)
  ));
}

export function isCircleConfigurationError(error: unknown): boolean {
  return matchesCircleError(error, details => details.code === -32012 || [details.message, details.details].some(value =>
    typeof value === 'string' && /cannot find the entity config in the system/i.test(value)
  ));
}

export function isCircleDuplicateUsernameError(error: unknown): boolean {
  return matchesCircleError(error, details => details.code === -32024 || [details.message, details.details].some(value =>
    typeof value === 'string' && /username is duplicated/i.test(value)
  ));
}

export function isCircleInvalidUsernameError(error: unknown): boolean {
  return matchesCircleError(error, details => details.code === -32025 || [details.message, details.details].some(value =>
    typeof value === 'string' && /username is invalid/i.test(value)
  ));
}

export function circleUsernameError(username: string): string | null {
  return /^[a-zA-Z0-9_@.:+\-]{5,50}$/.test(username.trim())
    ? null
    : 'The username is invalid. Use 5–50 characters: letters, numbers, or _ @ . : + -. Spaces are not allowed.';
}

export function circleConnectionError(error: unknown, hostname: string): string {
  if (isCircleDuplicateUsernameError(error)) {
    return 'This username is already taken. If you previously created a wallet, choose “Sign in with passkey” on the device where you saved it. Otherwise, choose a different username.';
  }
  if (isCircleInvalidUsernameError(error)) {
    return circleUsernameError('') ?? 'Choose a valid username.';
  }
  if (isCircleConfigurationError(error)) {
    return `Circle passkey setup is missing for this app. In the same Circle Console account and test environment as your Client Key, open Wallets → Modular Wallets → Passkey and save a configuration for ${hostname}. The Client Key’s Web domain must match. Then retry creating your wallet. If already configured, ask Circle support to check error -32012.`;
  }
  if (isCircleCredentialError(error)) {
    return `Circle rejected this app’s client key. In Circle Console, check that the Client Key is active and its Web domain is ${hostname}, then configure the same domain under Wallets → Modular Wallets → Passkey. If the key was revoked or belongs to another app, replace it with a matching Client Key.`;
  }
  if (error instanceof Error && error.name === 'NotAllowedError') {
    return 'Passkey creation or sign-in was cancelled. Please try again.';
  }
  return 'Circle wallet connection failed. Check your connection and Circle passkey setup, then try again.';
}