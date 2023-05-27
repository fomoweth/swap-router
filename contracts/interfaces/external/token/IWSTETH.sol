// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20Permit.sol";

interface IWSTETH is IERC20Permit {
    function stETH() external view returns (address);

    function wrap(uint256 _stETHAmount) external returns (uint256);

    function unwrap(uint256 _wstETHAmount) external returns (uint256);

    function getWstETHByStETH(
        uint256 _stETHAmount
    ) external view returns (uint256);

    function getStETHByWstETH(
        uint256 _wstETHAmount
    ) external view returns (uint256);

    function stEthPerToken() external view returns (uint256);

    function tokensPerStEth() external view returns (uint256);
}
