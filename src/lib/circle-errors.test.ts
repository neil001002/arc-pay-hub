import { describe, expect, it } from 'vitest';
import { circleUsernameError, isCircleDuplicateUsernameError, isCircleInvalidUsernameError, isCircleCredentialError, isCircleConfigurationError } from './circle-errors';

describe('Circle username rejection', () => {
  it('recognizes duplicate username RPC code -32024 in a nested cause', () => {
    expect(isCircleDuplicateUsernameError({ cause: { code: -32024 } })).toBe(true);
    expect(isCircleConfigurationError({ cause: { code: -32024 } })).toBe(false);
  });
  it('recognizes duplicate usernames wrapped by viem', () => {
    expect(isCircleDuplicateUsernameError({ details: 'Returned error: The username is duplicated.' })).toBe(true);
  });
  it('recognizes invalid username RPC code -32025 in a nested cause', () => {
    expect(isCircleInvalidUsernameError({ cause: { code: -32025 } })).toBe(true);
    expect(isCircleDuplicateUsernameError({ cause: { code: -32025 } })).toBe(false);
  });
  it('recognizes invalid usernames wrapped by viem', () => {
    expect(isCircleInvalidUsernameError({ details: 'Returned error: The username is invalid.' })).toBe(true);
  });
  it('rejects spaces in the reported username', () => {
    expect(circleUsernameError('Sunil Kumar')).not.toBeNull();
    expect(circleUsernameError('Sunil_Kumar')).toBeNull();
  });
  it('requires between 5 and 50 characters after trimming', () => {
    expect(circleUsernameError('a'.repeat(4))).not.toBeNull();
    expect(circleUsernameError('a'.repeat(5))).toBeNull();
    expect(circleUsernameError('a'.repeat(50))).toBeNull();
    expect(circleUsernameError('a'.repeat(51))).not.toBeNull();
    expect(circleUsernameError('  sunil  ')).toBeNull();
  });
  it('accepts Circle username symbols but rejects other punctuation', () => {
    expect(circleUsernameError('user_@.:+-123')).toBeNull();
    expect(circleUsernameError('user/name')).not.toBeNull();
  });
});

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