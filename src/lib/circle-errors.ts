export function isCircleCredentialError(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const details = current as { message?: unknown; details?: unknown; status?: unknown; cause?: unknown };
    if (details.status === 401 || [details.message, details.details].some(value =>
      typeof value === 'string' && /invalid credentials|unauthorized/i.test(value)
    )) return true;
    current = details.cause;
  }
  return false;
}

export function circleConnectionError(error: unknown, hostname: string): string {
  if (isCircleCredentialError(error)) {
    return `Circle rejected this app’s client key. In Circle Console, check that the Client Key is active and its Web domain is ${hostname}, then configure the same domain under Wallets → Modular Wallets → Passkey. If the key was revoked or belongs to another app, replace it with a matching Client Key.`;
  }
  if (error instanceof Error && error.name === 'NotAllowedError') {
    return 'Passkey creation or sign-in was cancelled. Please try again.';
  }
  return 'Circle wallet connection failed. Check your connection and Circle passkey setup, then try again.';
}