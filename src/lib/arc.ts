import { defineChain, erc20Abi, parseAbi, type Address } from 'viem';
// Public chain configuration only; never place private signing keys in VITE_ variables.
export const arc = defineChain({ id:Number(import.meta.env['VITE_ARC_CHAIN_ID'] || 5042002), name:import.meta.env['VITE_ARC_CHAIN_NAME'] || 'Arc Testnet', nativeCurrency:{ name:'USDC', symbol:'USDC', decimals:18 }, rpcUrls:{default:{http:[import.meta.env['VITE_ARC_RPC_URL'] || 'https://rpc.testnet.arc.io']}}, blockExplorers:{default:{name:'Arc Explorer',url:import.meta.env['VITE_ARC_EXPLORER_URL'] || 'https://explorer.testnet.arc.io'}}, testnet:import.meta.env['VITE_ARC_TESTNET'] !== 'false' });
export const usdc = (import.meta.env['VITE_USDC_ADDRESS'] || '0x3600000000000000000000000000000000000000') as Address;
export const eurc = (import.meta.env['VITE_TARGET_STABLECOIN_ADDRESS'] || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') as Address;
export const routerAddress = import.meta.env['VITE_DEX_ROUTER_ADDRESS'] as Address | undefined;
export const routerAbi = parseAbi(['function getAmountsOut(uint256 amountIn,address[] path) view returns (uint256[])','function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline) returns (uint256[])']);
export const vaultAddress = import.meta.env['VITE_VAULT_ADDRESS'] as Address | undefined;
export { erc20Abi };
export const vaultAbi = parseAbi(['function convertToLocalStablecoin(uint256 amountUSDC,address targetStablecoin) returns (uint256)', 'event FXConversion(address indexed user,uint256 amountIn,address tokenIn,uint256 amountOut,address tokenOut)']);
