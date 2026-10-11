import { createFileRoute } from '@tanstack/react-router';
import { Workspace } from '@/components/payments/workspace';
export const Route=createFileRoute('/')({head:()=>({meta:[{title:'FreelancePay on Arc — Borderless payments'},{name:'description',content:'Receive global freelancer payments in USDC and convert to local stablecoins on Arc.'},{property:'og:title',content:'FreelancePay on Arc — Borderless payments'},{property:'og:description',content:'Your work. Your world. Your money. USDC payments on Arc.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Index});
function Index(){return <Workspace/>;}
