// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev ABI boundary for Universal Router's original v4 exact-input format.
/// https://docs.uniswap.org/contracts/v4/guides/swap-routing
library UniswapV4Types {
 struct PoolKey { address currency0; address currency1; uint24 fee; int24 tickSpacing; address hooks; }
 struct ExactInputSingleParams { PoolKey poolKey; bool zeroForOne; uint128 amountIn; uint128 amountOutMinimum; bytes hookData; }
 struct QuoteExactSingleParams { PoolKey poolKey; bool zeroForOne; uint128 exactAmount; bytes hookData; }
}
interface IUniversalRouter {
 function execute(bytes calldata commands,bytes[] calldata inputs,uint256 deadline) external payable;
 function poolManager() external view returns(address);
 function PERMIT2() external view returns(address);
}
interface IPermit2Allowance {
 function approve(address token,address spender,uint160 amount,uint48 expiration) external;
}
interface IV4Quote {
 function poolManager() external view returns(address);
 function quoteExactInputSingle(UniswapV4Types.QuoteExactSingleParams calldata params) external returns(uint256 amountOut,uint256 gasEstimate);
}