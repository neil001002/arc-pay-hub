import { defineChain, erc20Abi, parseAbi, type Address } from 'viem';
// Public chain configuration only; never place private signing keys in VITE_ variables.
export const arc = defineChain({ id:Number(import.meta.env.VITE_ARC_CHAIN_ID || 5042002), name:'Arc Testnet', nativeCurrency:{ name:'USDC', symbol:'USDC', decimals:18 }, rpcUrls:{default:{http:[import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.testnet.arc.network']}}, blockExplorers:{default:{name:'Arc Explorer',url:import.meta.env.VITE_ARC_EXPLORER_URL || 'https://testnet.arcscan.app'}}, testnet:true });
export const usdc = (import.meta.env.VITE_USDC_ADDRESS || '0x3600000000000000000000000000000000000000') as Address;
export const eurc = (import.meta.env.VITE_TARGET_STABLECOIN_ADDRESS || '0x89B31F0F3aA5F2Fa0C4aF2D24CFb1d0dCC3b0425') as Address;
export const vaultAddress = import.meta.env.VITE_VAULT_ADDRESS as Address | undefined;
export { erc20Abi };
export const vaultAbi = parseAbi(['function convertToLocalStablecoin(uint256 amountUSDC,address targetStablecoin) returns (uint256)', 'event FXConversion(address indexed user,uint256 amountIn,address tokenIn,uint256 amountOut,address tokenOut)']);
