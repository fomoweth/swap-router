// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAdapter {
    function id() external view returns (bytes32);

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) external payable returns (uint256);

    function query(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256);

    function getPool(
        address tokenA,
        address tokenB
    ) external view returns (address pool);
}
