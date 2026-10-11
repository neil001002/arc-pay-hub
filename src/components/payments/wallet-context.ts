import { createContext } from 'react';
import type { WalletState } from './wallet';

// Keep the context identity stable when wallet components refresh during development.
export const WalletContext = createContext<WalletState | null>(null);