import { describe,it,expect } from 'vitest';
import { defaultParseSearch as parseSearch } from '@tanstack/react-router';
import { paymentAmount,makePaymentLink,validRecipient,paymentLinkSearch } from './payment-utils';
const address='0x3600000000000000000000000000000000000000';
describe('USDC payment rules',()=>{
 it('represents USDC using exactly 6 decimals',()=>{expect(paymentAmount('1.123456')).toBe(1123456n);expect(()=>paymentAmount('1.1234567')).toThrow();});
 it('requires an amount greater than zero',()=>{expect(()=>paymentAmount('0')).toThrow();expect(()=>paymentAmount('-1')).toThrow();expect(paymentAmount('0.000001')).toBe(1n);});
 it('puts recipient and amount in the shareable /pay link',()=>{const link=new URL(makePaymentLink('https://example.com',address,'25.50'));expect(link.pathname).toBe('/pay');expect(paymentLinkSearch(parseSearch(link.search))).toEqual({to:address,amount:'25.50',network:'testnet'});});
 it('keeps Arc Mainnet in mainnet payment links',()=>{const link=new URL(makePaymentLink('https://example.com',address,'10','mainnet'));expect(paymentLinkSearch(parseSearch(link.search)).network).toBe('mainnet');});
 it('treats links without a network as Arc Testnet',()=>{expect(paymentLinkSearch(parseSearch(`?to=${address}&amount=5`)).network).toBe('testnet');});
 it.each(['25','25.50','0.000001','1.123456','123456789123456789.123456'])('preserves exact amount %s in new links',amount=>{const link=new URL(makePaymentLink('https://example.com',address,amount));const search=paymentLinkSearch(parseSearch(link.search));expect(search.amount).toBe(amount);expect(paymentAmount(search.amount)).toBe(paymentAmount(amount));});
 it.each(['25','25.50','0.000001','1.123456'])('accepts existing unquoted amount %s',amount=>{const search=paymentLinkSearch(parseSearch(`?to=${address}&amount=${amount}`));expect(search.to).toBe(address);expect(paymentAmount(search.amount)).toBe(paymentAmount(amount));});
 it.each([undefined,null,true,{},[],Infinity])('rejects non-payment search amounts %s',amount=>{expect(()=>paymentAmount(paymentLinkSearch({to:address,amount}).amount)).toThrow();});
 it('rejects malformed recipients',()=>{expect(validRecipient('not-a-wallet')).toBe(false);expect(()=>makePaymentLink('https://example.com','bad','10')).toThrow();});
});
