// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/external/Uniswap/V2/IUniswapV2Factory.sol";
import "../interfaces/external/Uniswap/V2/IUniswapV2Pair.sol";
import "./BaseAdapter.sol";

contract V2Swap is BaseAdapter {
    using TransferHelper for address;

    IUniswapV2Factory public immutable factory;

    constructor(
        bytes32 _id,
        address _weth,
        address _factory
    ) BaseAdapter(_id, _weth) {
        factory = IUniswapV2Factory(_factory);
    }

    function getPool(
        address tokenA,
        address tokenB
    ) external view returns (address pool) {
        return pairFor(tokenA, tokenB);
    }

    function _swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) internal override returns (uint256 amountOut) {
        if (tokenIn.isNative()) {
            wrap(amountIn);
            tokenIn = WETH;
        }

        address pair = pairFor(tokenIn, tokenOut);

        if (pair == address(0)) revert PoolNotFound();

        (uint256 reserveIn, uint256 reserveOut) = getReserves(
            pair,
            tokenIn,
            tokenOut
        );

        amountOut = computeAmountOut(amountIn, reserveIn, reserveOut);

        (address token0, ) = sortTokens(tokenIn, tokenOut);

        (uint256 amountOut0, uint256 amountOut1) = tokenIn == token0
            ? (uint256(0), amountOut)
            : (amountOut, uint256(0));

        tokenIn.safeTransfer(pair, amountIn);

        IUniswapV2Pair(pair).swap(
            amountOut0,
            amountOut1,
            recipient,
            new bytes(0)
        );
    }

    function _query(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view override returns (uint256 amountOut) {
        address pair = pairFor(tokenIn, tokenOut);

        if (pair == address(0)) return 0;

        (uint256 reserveIn, uint256 reserveOut) = getReserves(
            pair,
            tokenIn,
            tokenOut
        );

        return computeAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getReserves(
        address pair,
        address tokenA,
        address tokenB
    ) private view returns (uint256 reserveA, uint256 reserveB) {
        (address token0, ) = sortTokens(tokenA, tokenB);

        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair)
            .getReserves();

        (reserveA, reserveB) = tokenA == token0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
    }

    function pairFor(
        address tokenA,
        address tokenB
    ) private view returns (address pair) {
        return factory.getPair(tokenA, tokenB);
    }

    function computeAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) private pure returns (uint256) {
        if (amountIn == 0 || reserveIn == 0 || reserveOut == 0) return 0;

        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;

        return numerator / denominator;
    }

    function sortTokens(
        address tokenA,
        address tokenB
    ) private pure returns (address, address) {
        return tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }
}
