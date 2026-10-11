// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockStablecoin is ERC20 {
    constructor() ERC20("Mock stablecoin", "MOCK") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract MockRouter {
    uint256 public output = 900_000;
    bool public skipInput;
    address public callbackVault;
    bool public reentryBlocked;
    function configure(uint256 value, bool skip, address callback) external {
        output = value; skipInput = skip; callbackVault = callback;
    }
    function getAmountsOut(uint256 amount, address[] calldata) external view returns (uint256[] memory values) {
        values = new uint256[](2); values[0] = amount; values[1] = output;
    }
    function swapExactTokensForTokens(uint256 amount, uint256, address[] calldata path, address to, uint256) external returns (uint256[] memory values) {
        if (callbackVault != address(0)) {
            (bool ok,) = callbackVault.call(abi.encodeWithSignature("forwardUSDC(address,uint256)", address(1), 1));
            reentryBlocked = !ok;
        }
        if (!skipInput) IERC20(path[0]).transferFrom(msg.sender, address(this), amount);
        IERC20(path[1]).transfer(to, output);
        values = new uint256[](2); values[0] = amount; values[1] = output;
    }
}