import { isAddress, parseUnits } from 'viem';
export function paymentAmount(value: string): bigint {
 if (!/^\d+(\.\d{1,6})?$/.test(value)) throw new Error('Enter a USDC amount with up to 6 decimal places.');
 const amount = parseUnits(value, 6);
 if (amount <= 0n) throw new Error('Amount must be greater than zero.');
 return amount;
}
export function validRecipient(value: string) { return isAddress(value); }
export function shortAddress(address: string) { return `${address.slice(0,6)}…${address.slice(-4)}`; }
export function makePaymentLink(origin: string, address: string, amount: string) {
 if (!validRecipient(address)) throw new Error('A valid recipient wallet is required.');
 paymentAmount(amount);
 return `${origin}/pay?to=${address}&amount=${encodeURIComponent(amount)}`;
}
