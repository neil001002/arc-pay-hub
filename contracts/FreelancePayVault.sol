// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
interface IStablecoinRouter {
 function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory);
 function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] calldata path,address to,uint256 deadline) external returns(uint256[] memory);
}
/// @notice Noncustodial payment forwarding and conversion through a verified V2 router.
/// @dev Unaudited testnet MVP. The caller must supply an independently acceptable
/// minimum output and deadline; a router quote alone is not a price oracle.
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
 function convertToLocalStablecoin(uint256 amountUSDC,address targetStablecoin,uint256 minimumOut,uint256 deadline) external nonReentrant returns(uint256 amountOut) {
  require(amountUSDC > 0,"Amount must be positive");
  require(targetStablecoin == localStablecoin,"Unsupported stablecoin");
  require(minimumOut > 0,"Minimum output required");
  require(deadline >= block.timestamp,"Expired deadline");
  require(deadline <= block.timestamp + 300,"Deadline too distant");
  address[] memory path=new address[](2); path[0]=address(USDC);path[1]=targetStablecoin;
  IERC20 target=IERC20(targetStablecoin);
  uint256 beforeBalance=target.balanceOf(address(this));
  uint256 beforeInput=USDC.balanceOf(address(this));
  USDC.safeTransferFrom(msg.sender,address(this),amountUSDC);
  require(USDC.balanceOf(address(this)) == beforeInput + amountUSDC,"Unsupported input transfer");
  USDC.forceApprove(address(router),amountUSDC);
  router.swapExactTokensForTokens(amountUSDC,minimumOut,path,address(this),deadline);
  USDC.forceApprove(address(router),0);
  require(USDC.balanceOf(address(this)) == beforeInput,"Incomplete input spend");
  amountOut=target.balanceOf(address(this))-beforeBalance;
  require(amountOut>=minimumOut,"Insufficient output");
  uint256 recipientBefore=target.balanceOf(msg.sender);
  target.safeTransfer(msg.sender,amountOut);
  require(target.balanceOf(msg.sender) == recipientBefore + amountOut,"Unsupported output transfer");
  emit FXConversion(msg.sender,amountUSDC,address(USDC),amountOut,targetStablecoin);
 }
 function forwardUSDC(address to,uint256 amount) external nonReentrant {
  require(to!=address(0) && to!=address(this) && to!=msg.sender && amount>0,"Invalid payment");
  uint256 beforeBalance=USDC.balanceOf(to);
  USDC.safeTransferFrom(msg.sender,to,amount);
  require(USDC.balanceOf(to) == beforeBalance + amount,"Unsupported payment transfer");
  emit PaymentReceived(msg.sender,to,amount);
 }
}
