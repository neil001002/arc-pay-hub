import { describe,it,expect } from 'vitest';
import { paymentAmount,makePaymentLink,validRecipient } from './payment-utils';
const address='0x3600000000000000000000000000000000000000';
describe('USDC payment rules',()=>{
 it('represents USDC using exactly 6 decimals',()=>{expect(paymentAmount('1.123456')).toBe(1123456n);expect(()=>paymentAmount('1.1234567')).toThrow();});
 it('requires an amount greater than zero',()=>{expect(()=>paymentAmount('0')).toThrow();expect(()=>paymentAmount('-1')).toThrow();expect(paymentAmount('0.000001')).toBe(1n);});
 it('puts recipient and amount in the shareable /pay link',()=>{expect(makePaymentLink('https://example.com',address,'25.50')).toBe(`https://example.com/pay?to=${address}&amount=25.50`);});
 it('rejects malformed recipients',()=>{expect(validRecipient('not-a-wallet')).toBe(false);expect(()=>makePaymentLink('https://example.com','bad','10')).toThrow();});
});
