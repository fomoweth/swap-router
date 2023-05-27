// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../types/DataTypes.sol";

interface ISwapRouter {
    event AdaptersUpdated(address[] indexed adapters);

    event BridgeTokensUpdated(address[] indexed bridgeTokens);

    function swap(
        Route memory route,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient,
        uint256 deadline
    ) external payable returns (uint256 amountOut);

    function quote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (Quote memory q);

    function query(
        uint8 maxHop,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (Query memory q);

    function getAdapters() external view returns (address[] memory adapters);

    function getAdaptersCount() external view returns (uint256 count);

    function setAdapters(address[] memory adapters) external;

    function getBridgeTokens()
        external
        view
        returns (address[] memory bridgeTokens);

    function getBridgeTokensCount() external view returns (uint256 count);

    function setBridgeTokens(address[] memory bridgeTokens) external;
}
