import { defineChain, erc20Abi, parseAbi, type Address } from 'viem';
// Public chain configuration only; never place private signing keys in VITE_ variables.
export const arc = defineChain({ id:Number(import.meta.env['VITE_ARC_CHAIN_ID'] || 5042002), name:import.meta.env['VITE_ARC_CHAIN_NAME'] || 'Arc Testnet', nativeCurrency:{ name:'USDC', symbol:'USDC', decimals:18 }, rpcUrls:{default:{http:[import.meta.env['VITE_ARC_RPC_URL'] || 'https://rpc.testnet.arc.io']}}, blockExplorers:{default:{name:'Arc Explorer',url:import.meta.env['VITE_ARC_EXPLORER_URL'] || 'https://explorer.testnet.arc.io'}}, testnet:import.meta.env['VITE_ARC_TESTNET'] !== 'false' });
export const usdc = (import.meta.env['VITE_USDC_ADDRESS'] || '0x3600000000000000000000000000000000000000') as Address;
export const eurc = (import.meta.env['VITE_TARGET_STABLECOIN_ADDRESS'] || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') as Address;
// Community-deployed Uniswap V2 Router02 on Arc Testnet with a live USDC/EURC pool; override with VITE_DEX_ROUTER_ADDRESS.
export const routerAddress = (import.meta.env['VITE_DEX_ROUTER_ADDRESS'] || '0xe27d5d256b370604f1ff060fb489c6a8e3f8a6d9') as Address;
export const routerAbi = parseAbi(['function getAmountsOut(uint256 amountIn,address[] path) view returns (uint256[])','function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline) returns (uint256[])']);
export const vaultAddress = import.meta.env['VITE_VAULT_ADDRESS'] as Address | undefined;
export { erc20Abi };
export const vaultAbi = parseAbi(['function USDC() view returns (address)', 'function localStablecoin() view returns (address)', 'function router() view returns (address)', 'function forwardUSDC(address to,uint256 amount)', 'function convertToLocalStablecoin(uint256 amountUSDC,address targetStablecoin,uint256 minimumOut,uint256 deadline) returns (uint256)', 'event PaymentReceived(address indexed from,address indexed to,uint256 amount)', 'event FXConversion(address indexed user,uint256 amountIn,address tokenIn,uint256 amountOut,address tokenOut)']);
