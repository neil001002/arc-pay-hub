// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
interface IStablecoinRouter {
 function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory);
 function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] calldata path,address to,uint256 deadline) external returns(uint256[] memory);
}
/// @notice Hackathon vault for a VERIFIED Uniswap-V2-compatible router, not StableFX.
/// @dev 1% quoted slippage protection is not an oracle; this MVP is NOT audited.
contract FreelancePayVault is ReentrancyGuard {
 using SafeERC20 for IERC20;
 IERC20 public immutable USDC;
 address public immutable localStablecoin;
 IStablecoinRouter public immutable router;
 event FXConversion(address indexed user,uint256 amountIn,address tokenIn,uint256 amountOut,address tokenOut);
 event PaymentReceived(address indexed from,address indexed to,uint256 amount);
 constructor(address usdc,address target,address swapRouter) {
  require(usdc != address(0) && target != address(0) && swapRouter != address(0),"Zero address");
  require(usdc != target,"Identical tokens");
  require(usdc.code.length > 0 && target.code.length > 0 && swapRouter.code.length > 0,"Contract required");
  USDC=IERC20(usdc); localStablecoin=target; router=IStablecoinRouter(swapRouter);
 }
 function convertToLocalStablecoin(uint256 amountUSDC,address targetStablecoin) external nonReentrant returns(uint256 amountOut) {
  require(amountUSDC > 0,"Amount must be positive");
  require(targetStablecoin == localStablecoin,"Unsupported stablecoin");
  address[] memory path=new address[](2); path[0]=address(USDC);path[1]=targetStablecoin;
  uint256[] memory quote=router.getAmountsOut(amountUSDC,path);
  require(quote.length==2 && quote[1]>0,"No liquidity");
  uint256 minimumOut=quote[1]*9900/10000;
  require(minimumOut>0,"Amount too small");
  IERC20 target=IERC20(targetStablecoin);uint256 beforeBalance=target.balanceOf(address(this));
  USDC.safeTransferFrom(msg.sender,address(this),amountUSDC);
  USDC.forceApprove(address(router),amountUSDC);
  router.swapExactTokensForTokens(amountUSDC,minimumOut,path,address(this),block.timestamp+300);
  USDC.forceApprove(address(router),0);
  amountOut=target.balanceOf(address(this))-beforeBalance;
  require(amountOut>=minimumOut,"Insufficient output");
  target.safeTransfer(msg.sender,amountOut);
  emit FXConversion(msg.sender,amountUSDC,address(USDC),amountOut,targetStablecoin);
 }
 function forwardUSDC(address to,uint256 amount) external nonReentrant {
  require(to!=address(0) && amount>0,"Invalid payment");
  USDC.safeTransferFrom(msg.sender,to,amount);
  emit PaymentReceived(msg.sender,to,amount);
 }
}
