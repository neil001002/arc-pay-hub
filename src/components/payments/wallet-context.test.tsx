import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WalletContext } from './wallet-context';

vi.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: false }),
  useConnect: () => ({ connectors: [], connectAsync: vi.fn(), isPending: false }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useReadContract: () => ({ refetch: vi.fn() }),
  usePublicClient: () => undefined,
  useSwitchChain: () => ({ switchChainAsync: vi.fn() }),
  useWriteContract: () => ({ writeContractAsync: vi.fn() }),
}));
vi.mock('@/lib/wagmi', () => ({ openAppKit: vi.fn() }));

import { WalletProvider, useWallet } from './wallet';
import { useContext } from 'react';

function Consumer() {
  const wallet = useWallet();
  const shared = useContext(WalletContext);
  return <output aria-label="shared wallet state">{wallet === shared ? wallet.balance : 'different context'}</output>;
}

describe('Shared wallet context', () => {
  it('provides the same wallet state to independently imported consumers', () => {
    render(<WalletProvider><Consumer /></WalletProvider>);
    expect(screen.getByLabelText('shared wallet state').textContent).toBe('2,450.00');
  });
});