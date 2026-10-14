// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {FreelancePayVault} from "./FreelancePayVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {UniswapV4Types as V4,IUniversalRouter,IPermit2Allowance,IV4Quote} from "./UniswapV4Types.sol";

/// @notice Noncustodial ERC-20 USDC -> EURC using an immutable, hookless v4 pool.
/// @dev Unaudited. Targets the original v4 Universal Router tuple (no minHopPriceX36).
/// Newer router versions changing that tuple require a different deployment.
contract FreelancePayV4Vault is FreelancePayVault {
 using SafeERC20 for IERC20;
 address public immutable permit2;
 address public immutable quoter;
 address public immutable poolManager;
 uint24 public immutable poolFee;
 int24 public immutable poolTickSpacing;
 constructor(address input,address output,address universalRouter,address permit,address quote,uint24 fee,int24 spacing)
  FreelancePayVault(input,output,universalRouter) {
  require(permit.code.length > 0 && quote.code.length > 0,"Contract required");
  require(fee <= 1_000_000 && spacing > 0 && spacing <= 32767,"Invalid pool configuration");
  address manager=IUniversalRouter(universalRouter).poolManager();
  require(manager.code.length > 0 && IV4Quote(quote).poolManager() == manager,"Pool manager mismatch");
  require(IUniversalRouter(universalRouter).PERMIT2() == permit,"Permit2 mismatch");
  permit2=permit;quoter=quote;poolManager=manager;poolFee=fee;poolTickSpacing=spacing;
 }
 function poolKey() public view returns(V4.PoolKey memory) {
  (address token0,address token1)=address(USDC)<localStablecoin ? (address(USDC),localStablecoin) : (localStablecoin,address(USDC));
  return V4.PoolKey(token0,token1,poolFee,poolTickSpacing,address(0));
 }
 /// @dev eth_call simulation only in the app: Quoter uses non-view pool simulation.
 function quoteConversion(uint256 amount) external returns(uint256 amountOut) {
  require(amount > 0 && amount <= type(uint128).max,"Invalid quote amount");
  (amountOut,)=IV4Quote(quoter).quoteExactInputSingle(V4.QuoteExactSingleParams(poolKey(),address(USDC)<localStablecoin,uint128(amount),""));
 }
 function _swap(uint256 amount,uint256 minimum,uint256 deadline) internal override {
  require(amount <= type(uint128).max && minimum <= type(uint128).max,"Amount exceeds uint128");
  require(deadline <= type(uint48).max,"Deadline exceeds uint48");
  // Router pays PoolManager through Permit2; never approve the router as ERC-20 spender.
  USDC.forceApprove(permit2,amount);
  IPermit2Allowance(permit2).approve(address(USDC),address(router),uint160(amount),uint48(deadline));
  bytes[] memory actions=new bytes[](3);
  actions[0]=abi.encode(V4.ExactInputSingleParams(poolKey(),address(USDC)<localStablecoin,uint128(amount),uint128(minimum),""));
  actions[1]=abi.encode(address(USDC),amount);
  actions[2]=abi.encode(localStablecoin,minimum);
  bytes[] memory inputs=new bytes[](1);
  // SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL. TAKE_ALL returns to this vault.
  inputs[0]=abi.encode(hex"060c0f",actions);
  // V4_SWAP, with no allow-revert flag: failure rolls back the entire conversion.
  IUniversalRouter(address(router)).execute(hex"10",inputs,deadline);
  IPermit2Allowance(permit2).approve(address(USDC),address(router),0,0);
  USDC.forceApprove(permit2,0);
 }
}