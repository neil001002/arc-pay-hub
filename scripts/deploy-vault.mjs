// Run locally: node --env-file=.env.local scripts/deploy-vault.mjs
import {compileContracts} from './compile-vault.mjs';
import {createPublicClient,createWalletClient,defineChain,http,isAddress} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
const usdc=process.env.VITE_USDC_ADDRESS;
const target=process.env.VITE_TARGET_STABLECOIN_ADDRESS;
const router=process.env.VITE_DEX_ROUTER_ADDRESS;
const key=process.env.DEPLOYER_PRIVATE_KEY;
if(!usdc||!target||!router||![usdc,target,router].every(isAddress)||!key)throw new Error('Set token addresses, verified router and DEPLOYER_PRIVATE_KEY in .env.local.');
const chain=defineChain({id:Number(process.env.VITE_ARC_CHAIN_ID||5042002),name:process.env.VITE_ARC_CHAIN_NAME||'Arc Testnet',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:{default:{http:[process.env.VITE_ARC_RPC_URL||'https://rpc.testnet.arc.io']}}});
const artifact=compileContracts()['FreelancePayVault.sol'].FreelancePayVault;
if(!artifact)throw new Error('Vault artifact missing');
const account=privateKeyToAccount(key);
const wallet=createWalletClient({account,chain,transport:http()});
const client=createPublicClient({chain,transport:http()});
if(await client.getChainId()!==chain.id)throw new Error('RPC chain does not match configured Arc chain.');
for(const address of [usdc,target,router]){
 const code=await client.getCode({address});
 if(!code||code==='0x')throw new Error('A configured token/router has no deployed bytecode.');
}
const decimalsAbi=[{type:'function',name:'decimals',stateMutability:'view',inputs:[],outputs:[{type:'uint8'}]}];
for(const address of [usdc,target]){
 if(await client.readContract({address,abi:decimalsAbi,functionName:'decimals'})!==6)throw new Error('The FreelancePay UI requires 6-decimal ERC-20 stablecoins.');
}
if(usdc.toLowerCase()===target.toLowerCase())throw new Error('Input and output tokens must differ.');
const hash=await wallet.deployContract({abi:artifact.abi,bytecode:`0x${artifact.evm.bytecode.object}`,args:[usdc,target,router]});
console.log('Deployment submitted:',hash);
const receipt=await client.waitForTransactionReceipt({hash});
if(receipt.status!=='success'||!receipt.contractAddress)throw new Error('Deployment failed');
console.log('Set VITE_VAULT_ADDRESS to',receipt.contractAddress);
