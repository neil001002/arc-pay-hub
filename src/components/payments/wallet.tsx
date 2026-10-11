import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi';
import { encodeFunctionData, formatUnits, parseEventLogs, type Address } from 'viem';
import { toast } from 'sonner';
import { arc, usdc, eurc, erc20Abi, vaultAddress, vaultAbi, routerAbi } from '@/lib/arc';
import { paymentAmount, shortAddress } from '@/lib/payment-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { circleClientKey, reownProjectId } from '@/lib/wallet-options';
import { openAppKit } from '@/lib/wagmi';
import type { CircleWallet } from '@/lib/circle-wallet';
import { Wallet, X, ArrowUpRight, LoaderCircle, Check } from 'lucide-react';
export type Activity = { id:string; type:'payment'|'conversion'; name:string; address:string; amount:string; output?:string|undefined; date:string; hash?:string|undefined; };
export const demoAddress:Address = '0x7a3d1b2c8f6e4a0d9c5b3f2e1a6d8c4b0e9f2a81';
const initialActivity:Activity[] = [
 {id:'d1',type:'payment',name:'Website redesign',address:'0x48a29C…71e3',amount:'1,250.00',date:'Oct 10, 2026 · 10:42 AM'},
 {id:'d2',type:'conversion',name:'USDC → EURC',address:'Stablecoin conversion',amount:'500.00',output:'428.65',date:'Oct 9, 2026 · 3:18 PM'},
 {id:'d3',type:'payment',name:'Brand identity project',address:'0x92b81F…3a6d',amount:'850.00',date:'Oct 8, 2026 · 9:06 AM'},
 {id:'d4',type:'payment',name:'Product consultation',address:'0x31c94A…8f21',amount:'350.00',date:'Oct 7, 2026 · 2:30 PM'},
];
function useWalletState() {
 const external = useAccount();
 const [circle, setCircle] = useState<CircleWallet | null>(null);
 const [circleConnecting, setCircleConnecting] = useState(false);
 const address = circle?.address ?? external.address;
 const isConnected = !!circle || external.isConnected;
 const chainId = circle ? arc.id : external.chainId;
 const { connectors, connectAsync, isPending:externalConnecting } = useConnect();
 const connecting = externalConnecting || circleConnecting;
 const { disconnect: disconnectExternal } = useDisconnect(); const { switchChainAsync } = useSwitchChain();
 function disconnect() { setCircle(null); disconnectExternal(); setDemo(true); setActivity(initialActivity); }
 const { writeContractAsync } = useWriteContract(); const client = usePublicClient({chainId:arc.id});
 const [modal,setModal] = useState(false); const [busy,setBusy] = useState(false); const [demo,setDemo] = useState(true);
 const [activity,setActivity] = useState<Activity[]>(initialActivity); const [loadingActivity,setLoadingActivity] = useState(false);
 const balance = useReadContract({address:usdc,abi:erc20Abi,functionName:'balanceOf',args:address?[address]:undefined,chainId:arc.id,query:{enabled:!!address,refetchInterval:15000}});
 const euroBalance = useReadContract({address:eurc,abi:erc20Abi,functionName:'balanceOf',args:address?[address]:undefined,chainId:arc.id,query:{enabled:!!address}});
 async function refreshActivity() {
  if (!address || !client) return;
  setLoadingActivity(true);
  try {
   const latest = await client.getBlockNumber(); const fromBlock = latest > 9999n ? latest - 9999n : 0n;
   const payments = await client.getContractEvents({ address:usdc,abi:erc20Abi,eventName:'Transfer',args:{to:address},fromBlock,toBlock:latest });
   const fx = vaultAddress ? await client.getContractEvents({address:vaultAddress,abi:vaultAbi,eventName:'FXConversion',args:{user:address},fromBlock,toBlock:latest}) : [];
   const entries = [...payments.map(p=>({log:p,type:'payment' as const})),...fx.map(p=>({log:p,type:'conversion' as const}))].sort((a,b)=> Number((b.log.blockNumber ?? 0n)-(a.log.blockNumber ?? 0n))).slice(0,20);
   const rows = await Promise.all(entries.map(async ({log,type})=>{
    const block = log.blockNumber ? await client.getBlock({blockNumber:log.blockNumber}) : undefined;
    const args = log.args as {from?:Address;value?:bigint;amountIn?:bigint;amountOut?:bigint};
    return {id:`${log.transactionHash}-${log.logIndex}`,type,name:type==='payment'?'USDC payment':'USDC → EURC',address:args.from?shortAddress(args.from):'Stablecoin conversion',amount:formatUnits(args.value ?? args.amountIn ?? 0n,6),output:args.amountOut?formatUnits(args.amountOut,6):undefined,date:block?new Date(Number(block.timestamp)*1000).toLocaleString():'Confirmed',hash:log.transactionHash ?? undefined};
   })); setActivity(rows);
  } catch { toast.error('Could not load recent activity. Try refreshing.'); } finally {setLoadingActivity(false);}
 }
 useEffect(()=>{ if(isConnected){setDemo(false);setActivity([]);void refreshActivity();} },[address,isConnected]);
 async function connectWallet() {
  if (reownProjectId) {
   try { await openAppKit(); setModal(false); } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not open AppKit.'); }
   return;
  }
  const connector = connectors[0];
  if(!connector || !await connector.getProvider()){toast.error('Install MetaMask or another browser wallet to connect.');return;}
  try{ await connectAsync({connector}); setModal(false); toast.success('Wallet connected'); }catch{toast.error('Connection was cancelled. Please try again.');}
 }
 async function connectCircle(register: boolean, username: string) {
  setCircleConnecting(true);
  try {
   const { connectCircleWallet } = await import('@/lib/circle-wallet');
   const wallet = await connectCircleWallet(register, username);
   disconnectExternal(); setCircle(wallet); setModal(false); toast.success('Circle wallet connected');
  } catch (error) { toast.error(error instanceof Error ? error.message : 'Passkey connection was cancelled.'); }
  finally { setCircleConnecting(false); }
 }
 async function ensureArc() { if(!circle && chainId!==arc.id) await switchChainAsync({chainId:arc.id}); }
 async function submitCall(call: Parameters<typeof writeContractAsync>[0]) {
  if (!circle) return writeContractAsync(call);
  return circle.sendCall(call.address, encodeFunctionData({ abi: call.abi, functionName: call.functionName, args: call.args }));
 }
 async function pay(to:Address,amount:string) {
  if(!address){setModal(true);return;}
  if(!client)throw new Error('Arc is unavailable. Please try again.');
  setBusy(true);
  try {await ensureArc();const hash = await submitCall({address:usdc,abi:erc20Abi,functionName:'transfer',args:[to,paymentAmount(amount)],chainId:arc.id});toast.message('Transaction submitted');const receipt = await client.waitForTransactionReceipt({hash});if(receipt.status!=='success')throw new Error('Transaction reverted.');toast.success('Payment confirmed');void balance.refetch();void refreshActivity();return hash;}finally{setBusy(false);}
 }
 async function convert(amount:string) {
  const units = paymentAmount(amount);
  if(!address){setModal(true);return;}
  if(!vaultAddress)throw new Error('FX conversion is not configured yet. Deploy a vault with a verified, liquid DEX router first.');
  if(!client)throw new Error('Arc is unavailable.');
  setBusy(true);
  try {
   await ensureArc();
   const [configuredInput,configuredTarget,configuredRouter]=await Promise.all([
    client.readContract({address:vaultAddress,abi:vaultAbi,functionName:'USDC'}),
    client.readContract({address:vaultAddress,abi:vaultAbi,functionName:'localStablecoin'}),
    client.readContract({address:vaultAddress,abi:vaultAbi,functionName:'router'}),
   ]);
   if(configuredInput.toLowerCase()!==usdc.toLowerCase()||configuredTarget.toLowerCase()!==eurc.toLowerCase())throw new Error('Vault tokens do not match the app configuration.');
   const allowance=await client.readContract({address:usdc,abi:erc20Abi,functionName:'allowance',args:[address,vaultAddress]});
   if(allowance<units){toast.message('Approve USDC in your wallet');const approval=await submitCall({address:usdc,abi:erc20Abi,functionName:'approve',args:[vaultAddress,units],chainId:arc.id});const r=await client.waitForTransactionReceipt({hash:approval});if(r.status!=='success')throw new Error('Approval failed.');}
   const quote=await client.readContract({address:configuredRouter,abi:routerAbi,functionName:'getAmountsOut',args:[units,[usdc,eurc]]});
   const outputQuote=quote[1];
   if(quote.length!==2||outputQuote===undefined||outputQuote<=0n)throw new Error('No conversion liquidity is available.');
   const minimumOut=outputQuote*9900n/10000n;
   if(minimumOut===0n)throw new Error('Conversion amount is too small.');
   const block=await client.getBlock();
   const hash=await submitCall({address:vaultAddress,abi:vaultAbi,functionName:'convertToLocalStablecoin',args:[units,eurc,minimumOut,block.timestamp+300n],chainId:arc.id});toast.message('Conversion submitted');const receipt=await client.waitForTransactionReceipt({hash});if(receipt.status!=='success')throw new Error('Conversion reverted.');
   const events=parseEventLogs({abi:vaultAbi,logs:receipt.logs,eventName:'FXConversion'}); const output=events[0]?.args.amountOut;toast.success(`Conversion confirmed${output?`: ${formatUnits(output,6)} EURC`:''}`);void balance.refetch();void euroBalance.refetch();void refreshActivity();return {hash,output:output?formatUnits(output,6):undefined};
  } finally {setBusy(false);}
 }
 return {address,isConnected,chainId,modal,setModal,connectWallet,connectCircle,walletKind:circle?'Circle passkey':'External wallet',connecting,disconnect,busy,pay,convert,demo,setDemo,activity,setActivity,refreshActivity,loadingActivity,balance:demo?'2,450.00':balance.data!==undefined?Number(formatUnits(balance.data,6)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:6}):'—',euroBalance:demo?'428.65':euroBalance.data!==undefined?Number(formatUnits(euroBalance.data,6)).toFixed(2):'—',balanceError:balance.isError};
}
const WalletContext = createContext<ReturnType<typeof useWalletState>|null>(null);
export function WalletProvider({children}:{children:ReactNode}) { const state=useWalletState();return <WalletContext.Provider value={state}>{children}<WalletDialog/></WalletContext.Provider>; }
export function useWallet(){const context=useContext(WalletContext);if(!context)throw new Error('Wallet provider is missing');return context;}
export function WalletButton(){const w=useWallet();return <Button variant="outline" onClick={()=>w.setModal(true)} className="h-10"><Wallet/>{w.address?shortAddress(w.address):'Connect wallet'}</Button>;}
function WalletDialog(){
 const w=useWallet(); const [username,setUsername]=useState('');
 if(!w.modal)return null;
 return <div className="dialog-backdrop" onClick={()=>w.setModal(false)}><div className="dialog-panel max-h-[90dvh] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Connect wallet" onClick={e=>e.stopPropagation()}>
 <div className="flex justify-between items-center mb-6"><div className="brand-mark"><Wallet size={18}/></div><Button variant="ghost" size="icon" aria-label="Close wallet dialog" onClick={()=>w.setModal(false)}><X/></Button></div>
 <h2 className="text-2xl font-semibold">{w.isConnected?'Your wallet':'Connect your wallet'}</h2>
 {w.isConnected?<><p className="text-sm break-all mt-4 mb-3">{w.address}</p><p className="text-sm text-muted-foreground mb-4">{w.walletKind}</p><div className="flex items-center gap-2 text-success mb-6"><Check size={16}/> Connected to {w.chainId===arc.id?'Arc Testnet':'another network'}</div><Button variant="outline" className="w-full" onClick={()=>{w.disconnect();w.setModal(false);}}>Disconnect wallet</Button></>:<div className="space-y-5 mt-6">
 <div className="space-y-3"><h3 className="text-sm font-semibold">Circle wallet</h3><label className="text-xs text-muted-foreground" htmlFor="passkey-name">Passkey name</label><Input id="passkey-name" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Your name" maxLength={64} disabled={!circleClientKey||w.connecting}/><Button className="w-full h-11" disabled={!circleClientKey||w.connecting||!username.trim()} onClick={()=>void w.connectCircle(true,username)}>{w.connecting?<LoaderCircle className="animate-spin"/>:<Wallet/>}Create Circle wallet</Button><Button variant="outline" className="w-full" disabled={!circleClientKey||w.connecting} onClick={()=>void w.connectCircle(false,'')}>Sign in with passkey</Button>{!circleClientKey&&<p className="text-xs text-muted-foreground" role="status">Circle setup pending</p>}</div>
 <div className="border-t border-border pt-5 space-y-3"><h3 className="text-sm font-semibold">External wallet</h3><Button variant="outline" className="w-full h-11" disabled={w.connecting} onClick={()=>void w.connectWallet()}><Wallet/>{reownProjectId?'Connect with AppKit':'Browser wallet'}<ArrowUpRight/></Button>{!reownProjectId&&<p className="text-xs text-muted-foreground" role="status">AppKit setup pending · Browser wallets available</p>}</div>
 </div>}<p className="mt-6 text-xs text-muted-foreground text-center">Testnet only. Never send real funds.</p></div></div>;
}
