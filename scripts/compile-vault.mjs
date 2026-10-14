// Local tooling only; never import this module into app routes.
import { readFileSync } from 'node:fs';
import solc from 'solc';

export function compileContracts(extraSources = {}) {
  const input = {
    language: 'Solidity',
    sources: {
      'FreelancePayVault.sol': { content: readFileSync('contracts/FreelancePayVault.sol', 'utf8') },
      'FreelancePayV4Vault.sol': { content: readFileSync('contracts/FreelancePayV4Vault.sol', 'utf8') },
      'UniswapV4Types.sol': { content: readFileSync('contracts/UniswapV4Types.sol', 'utf8') },
      ...extraSources,
    },
    settings: {
      // Explicit baseline for Arc and the local EVM; avoid compiler-default opcodes.
      evmVersion: 'paris',
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };
  const result = JSON.parse(solc.compile(JSON.stringify(input), {
    import: path => {
      try { return { contents: readFileSync(`node_modules/${path}`, 'utf8') }; }
      catch { return { error: `Missing dependency: ${path}` }; }
    },
  }));
  const errors = result.errors?.filter(e => e.severity === 'error') ?? [];
  if (errors.length) throw new Error(errors.map(e => e.formattedMessage).join('\n'));
  return result.contracts;
}