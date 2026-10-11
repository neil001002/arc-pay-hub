import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import ganache from 'ganache';
import { createPublicClient, createWalletClient, custom, zeroAddress, parseEventLogs } from 'viem';
import { compileContracts } from './compile-vault.mjs';

let provider, client, wallet, payer, recipient, tokens, router, vault, contracts;
before(async () => {
  contracts = compileContracts({ 'Mocks.sol': { content: readFileSync('contracts/test/Mocks.sol', 'utf8') } });
  provider = ganache.provider({ logging: { quiet: true }, chain: { hardfork: 'shanghai' }, wallet: { totalAccounts: 2 } });
  client = createPublicClient({ transport: custom(provider) });
  wallet = createWalletClient({ transport: custom(provider) });
  [payer, recipient] = await wallet.getAddresses();
});
after(async () => { await provider?.disconnect(); });

async function deploy(artifact, args = []) {
  const hash = await wallet.deployContract({ account: payer, chain: null, abi: artifact.abi, bytecode: `0x${artifact.evm.bytecode.object}`, args });
  const receipt = await client.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, 'success');
  assert.ok(receipt.contractAddress);
  return { address: receipt.contractAddress, abi: artifact.abi };
}
async function write(contract, functionName, args = []) {
  const request = await client.simulateContract({ ...contract, account: payer, functionName, args });
  const hash = await wallet.writeContract({ ...request.request, chain: null });
  const receipt = await client.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, 'success');
  return receipt;
}
const read = (contract, functionName, args = []) => client.readContract({ ...contract, functionName, args });
async function fixture() {
  tokens = [await deploy(contracts['Mocks.sol'].MockStablecoin), await deploy(contracts['Mocks.sol'].MockStablecoin)];
  router = await deploy(contracts['Mocks.sol'].MockRouter);
  vault = await deploy(contracts['FreelancePayVault.sol'].FreelancePayVault, [tokens[0].address, tokens[1].address, router.address]);
  await write(tokens[0], 'mint', [payer, 10_000_000n]);
  await write(tokens[1], 'mint', [router.address, 10_000_000n]);
  await write(tokens[0], 'approve', [vault.address, 10_000_000n]);
}
async function conversion(min = 890_000n, expiry) {
  const timestamp = (await client.getBlock()).timestamp;
  return write(vault, 'convertToLocalStablecoin', [1_000_000n, tokens[1].address, min, expiry ?? timestamp + 300n]);
}
async function rejectsCall(contract, name, args, reason) {
  await assert.rejects(() => client.simulateContract({ ...contract, account: payer, functionName: name, args }), error => error.message.includes(reason));
}

test('forwards exactly 1 USDC (1,000,000 base units) and emits payment event', async () => {
  await fixture();
  const receipt = await write(vault, 'forwardUSDC', [recipient, 1_000_000n]);
  assert.equal(await read(tokens[0], 'balanceOf', [recipient]), 1_000_000n);
  assert.equal(await read(tokens[0], 'balanceOf', [vault.address]), 0n);
  const [event] = parseEventLogs({ abi: vault.abi, logs: receipt.logs, eventName: 'PaymentReceived' });
  assert.equal(event.args.amount, 1_000_000n);
  assert.equal(event.args.to.toLowerCase(), recipient.toLowerCase());
});
test('rejects zero amount and invalid payment recipients', async () => {
  await fixture();
  for (const to of [zeroAddress, vault.address, payer]) await rejectsCall(vault, 'forwardUSDC', [to, 1n], 'Invalid payment');
  await rejectsCall(vault, 'forwardUSDC', [recipient, 0n], 'Invalid payment');
});
test('conversion delivers EURC, preserves prior vault funds and clears router allowance', async () => {
  await fixture();
  await write(tokens[0], 'mint', [vault.address, 17n]);
  await write(tokens[1], 'mint', [vault.address, 23n]);
  const receipt = await conversion();
  assert.equal(await read(tokens[1], 'balanceOf', [payer]), 900_000n);
  assert.equal(await read(tokens[0], 'balanceOf', [vault.address]), 17n);
  assert.equal(await read(tokens[1], 'balanceOf', [vault.address]), 23n);
  assert.equal(await read(tokens[0], 'allowance', [vault.address, router.address]), 0n);
  const [event] = parseEventLogs({ abi: vault.abi, logs: receipt.logs, eventName: 'FXConversion' });
  assert.equal(event.args.amountIn, 1_000_000n);
  assert.equal(event.args.amountOut, 900_000n);
});
test('caller minimum cannot be bypassed by a router returning too little', async () => {
  await fixture();
  await assert.rejects(() => conversion(900_001n), error => error.message.includes('Insufficient output'));
  assert.equal(await read(tokens[0], 'balanceOf', [payer]), 10_000_000n);
});
test('rejects zero input, unsupported target and missing minimum', async () => {
  await fixture(); const expiry = (await client.getBlock()).timestamp + 300n;
  await rejectsCall(vault, 'convertToLocalStablecoin', [0n, tokens[1].address, 1n, expiry], 'Amount must be positive');
  await rejectsCall(vault, 'convertToLocalStablecoin', [1n, tokens[0].address, 1n, expiry], 'Unsupported stablecoin');
  await rejectsCall(vault, 'convertToLocalStablecoin', [1n, tokens[1].address, 0n, expiry], 'Minimum output required');
});
test('rejects expired and over-five-minute deadlines', async () => {
  await fixture(); const now = (await client.getBlock()).timestamp;
  await rejectsCall(vault, 'convertToLocalStablecoin', [1n, tokens[1].address, 1n, now - 1n], 'Expired deadline');
  await rejectsCall(vault, 'convertToLocalStablecoin', [1n, tokens[1].address, 1n, now + 301n], 'Deadline too distant');
});
test('rejects router leaving approved input unspent', async () => {
  await fixture(); await write(router, 'configure', [900_000n, true, zeroAddress]);
  await assert.rejects(() => conversion(), error => error.message.includes('Incomplete input spend'));
});
test('blocks router reentry during conversion', async () => {
  await fixture(); await write(router, 'configure', [900_000n, false, vault.address]);
  await conversion(); assert.equal(await read(router, 'reentryBlocked'), true);
});
test('constructor rejects zero addresses, identical tokens and noncontracts', async () => {
  await fixture();
  for (const [args, reason] of [
    [[zeroAddress, tokens[1].address, router.address], 'Zero address'],
    [[tokens[0].address, tokens[0].address, router.address], 'Identical tokens'],
    [[tokens[0].address, tokens[1].address, recipient], 'Contract required'],
  ]) {
    await assert.rejects(() => deploy(contracts['FreelancePayVault.sol'].FreelancePayVault, args));
  }
});