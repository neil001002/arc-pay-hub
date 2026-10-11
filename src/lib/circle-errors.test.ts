import { describe, expect, it } from 'vitest';
import { isCircleCredentialError, isCircleConfigurationError } from './circle-errors';

describe('Circle missing entity configuration', () => {
  it('recognizes Circle RPC code -32012 inside a nested cause', () => {
    expect(isCircleConfigurationError({ cause: { code: -32012 } })).toBe(true);
  });
  it('recognizes the reported missing entity response in viem details', () => {
    expect(isCircleConfigurationError({ details: 'Returned error: Cannot find the entity config in the system.' })).toBe(true);
  });
  it('keeps credential rejection separate from configuration failures', () => {
    expect(isCircleConfigurationError({ cause: { status: 401, message: 'Invalid credentials.' } })).toBe(false);
  });
});

describe('Circle credential rejection classification', () => {
  it('recognizes the reported RPC credential rejection', () => {
    expect(isCircleCredentialError(new Error('An unknown RPC error occurred. Details: Returned error: Invalid credentials. Version: viem@2.57.4'))).toBe(true);
  });
  it('recognizes nested HTTP 401 responses', () => {
    expect(isCircleCredentialError({ cause: { status: 401 } })).toBe(true);
  });
  it('does not treat passkey cancellation as a credential failure', () => {
    expect(isCircleCredentialError(new DOMException('Cancelled', 'NotAllowedError'))).toBe(false);
  });
  it('handles circular causes without looping', () => {
    const error: { cause?: unknown } = {};
    error.cause = error;
    expect(isCircleCredentialError(error)).toBe(false);
  });
});