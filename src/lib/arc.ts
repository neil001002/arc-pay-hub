import { defineChain, erc20Abi, parseAbi, type Address } from 'viem';
// Public chain configuration only; never place private signing keys in VITE_ variables.
const env = import.meta.env;
export const arcTestnet = defineChain({ id:5042002, name:'Arc Testnet', nativeCurrency:{ name:'USDC', symbol:'USDC', decimals:18 }, rpcUrls:{default:{http:[env['VITE_ARC_TESTNET_RPC_URL'] || 'https://rpc.testnet.arc.io']}}, blockExplorers:{default:{name:'Arc Explorer',url:'https://explorer.testnet.arc.io'}}, testnet:true });
export const arcMainnet = defineChain({ id:5042, name:'Arc', nativeCurrency:{ name:'USDC', symbol:'USDC', decimals:18 }, rpcUrls:{default:{http:[env['VITE_ARC_MAINNET_RPC_URL'] || 'https://rpc.mainnet.arc.io']}}, blockExplorers:{default:{name:'Arc Explorer',url:'https://explorer.arc.io'}} });
/** @deprecated use the selected network; kept for testnet-only modules. */
export const arc = arcTestnet;
// The USDC ERC-20 interface uses the same system address on both Arc networks.
export const usdc = '0x3600000000000000000000000000000000000000' as Address;
export type NetworkKey = 'mainnet' | 'testnet';
export type ArcNetwork = { key:NetworkKey; label:string; chain:typeof arcTestnet|typeof arcMainnet; real:boolean; eurc?:Address|undefined; router?:Address|undefined; vault?:Address|undefined; circle:boolean };
export const arcNetworks: Record<NetworkKey, ArcNetwork> = {
  testnet: { key:'testnet', label:'Arc Testnet', chain:arcTestnet, real:false, circle:true,
    eurc:(env['VITE_TARGET_STABLECOIN_ADDRESS'] || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a') as Address,
    // Community-deployed Uniswap V2 Router02 with a live USDC/EURC pool.
    router:(env['VITE_DEX_ROUTER_ADDRESS'] || '0xe27d5d256b370604f1ff060fb489c6a8e3f8a6d9') as Address,
    vault:(env['VITE_VAULT_ADDRESS'] || '0xbe3de044c7c9a2c0a1c7b2d8bb0eb8551ee1ff7c') as Address },
  // Mainnet conversions stay off until an audited vault, router and EURC address are configured.
  mainnet: { key:'mainnet', label:'Arc Mainnet', chain:arcMainnet, real:true, circle:false,
    eurc:env['VITE_MAINNET_EURC_ADDRESS'] as Address|undefined, router:env['VITE_MAINNET_DEX_ROUTER_ADDRESS'] as Address|undefined, vault:env['VITE_MAINNET_VAULT_ADDRESS'] as Address|undefined },
};
export function parseNetworkKey(value: unknown): NetworkKey { return value === 'mainnet' ? 'mainnet' : 'testnet'; }
export const routerAbi = parseAbi(['function getAmountsOut(uint256 amountIn,address[] path) view returns (uint256[])','function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline) returns (uint256[])']);
export { erc20Abi };
export const vaultAbi = parseAbi(['function USDC() view returns (address)', 'function localStablecoin() view returns (address)', 'function router() view returns (address)', 'function forwardUSDC(address to,uint256 amount)', 'function convertToLocalStablecoin(uint256 amountUSDC,address targetStablecoin,uint256 minimumOut,uint256 deadline) returns (uint256)', 'event PaymentReceived(address indexed from,address indexed to,uint256 amount)', 'event FXConversion(address indexed user,uint256 amountIn,address tokenIn,uint256 amountOut,address tokenOut)']);
