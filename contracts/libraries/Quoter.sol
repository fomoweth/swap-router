// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/external/Uniswap/V3/IUniswapV3Pool.sol";
import "./SafeCast.sol";
import "./SwapMath.sol";
import "./TickBitmap.sol";
import "./TickMath.sol";

library Quoter {
    using SafeCast for uint256;
    using SafeCast for int256;

    error AmountSpecifiedZero();
    error SqrtPriceLimitOutOfBounds();

    struct SwapState {
        int256 amountSpecifiedRemaining;
        int256 amountCalculated;
        uint160 sqrtPriceX96;
        int24 tick;
        uint128 liquidity;
    }

    struct StepComputations {
        uint160 sqrtPriceStartX96;
        int24 tickNext;
        bool initialized;
        uint160 sqrtPriceNextX96;
        uint256 amountIn;
        uint256 amountOut;
        uint256 feeAmount;
    }

    function quote(
        IUniswapV3Pool pool,
        uint24 fee,
        bool zeroForOne,
        int256 amountSpecified
    ) internal view returns (int256 amount0, int256 amount1) {
        if (amountSpecified == 0) revert AmountSpecifiedZero();

        uint160 sqrtPriceLimitX96 = zeroForOne
            ? TickMath.MIN_SQRT_RATIO + 1
            : TickMath.MAX_SQRT_RATIO - 1;

        bool exactInput = amountSpecified > 0;

        int24 tickSpacing = pool.tickSpacing();

        (uint160 sqrtPriceX96, int24 tick, , , , , ) = pool.slot0();

        require(
            zeroForOne
                ? sqrtPriceLimitX96 < sqrtPriceX96 &&
                    sqrtPriceLimitX96 > TickMath.MIN_SQRT_RATIO
                : sqrtPriceLimitX96 > sqrtPriceX96 &&
                    sqrtPriceLimitX96 < TickMath.MAX_SQRT_RATIO
        );

        SwapState memory state = SwapState({
            amountSpecifiedRemaining: amountSpecified,
            amountCalculated: 0,
            sqrtPriceX96: sqrtPriceX96,
            tick: tick,
            liquidity: pool.liquidity()
        });

        while (
            state.amountSpecifiedRemaining != 0 &&
            state.sqrtPriceX96 != sqrtPriceLimitX96
        ) {
            StepComputations memory step;
            step.sqrtPriceStartX96 = state.sqrtPriceX96;

            (
                step.tickNext,
                step.initialized,
                step.sqrtPriceNextX96
            ) = TickBitmap.nextInitializedTickWithinOneWord(
                pool,
                state.tick,
                tickSpacing,
                zeroForOne
            );

            (
                state.sqrtPriceX96,
                step.amountIn,
                step.amountOut,
                step.feeAmount
            ) = SwapMath.computeSwapStep(
                state.sqrtPriceX96,
                (
                    zeroForOne
                        ? step.sqrtPriceNextX96 < sqrtPriceLimitX96
                        : step.sqrtPriceNextX96 > sqrtPriceLimitX96
                )
                    ? sqrtPriceLimitX96
                    : step.sqrtPriceNextX96,
                state.liquidity,
                state.amountSpecifiedRemaining,
                fee
            );

            if (exactInput) {
                unchecked {
                    state.amountSpecifiedRemaining =
                        state.amountSpecifiedRemaining -
                        (step.amountIn + step.feeAmount).toInt256();
                }

                state.amountCalculated =
                    state.amountCalculated -
                    step.amountOut.toInt256();
            } else {
                unchecked {
                    state.amountSpecifiedRemaining =
                        state.amountSpecifiedRemaining +
                        step.amountOut.toInt256();
                }

                state.amountCalculated =
                    state.amountCalculated +
                    (step.amountIn + step.feeAmount).toInt256();
            }

            if (state.sqrtPriceX96 == step.sqrtPriceNextX96) {
                if (step.initialized) {
                    (, int128 liquidityNet, , , , , , ) = pool.ticks(
                        step.tickNext
                    );

                    unchecked {
                        if (zeroForOne) liquidityNet = -liquidityNet;
                    }

                    state.liquidity = liquidityNet < 0
                        ? state.liquidity - uint128(-liquidityNet)
                        : state.liquidity + uint128(liquidityNet);
                }

                state.tick = zeroForOne ? step.tickNext - 1 : step.tickNext;
            } else if (state.sqrtPriceX96 != step.sqrtPriceStartX96) {
                state.tick = TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
            }
        }

        unchecked {
            (amount0, amount1) = zeroForOne == exactInput
                ? (
                    amountSpecified - state.amountSpecifiedRemaining,
                    state.amountCalculated
                )
                : (
                    state.amountCalculated,
                    amountSpecified - state.amountSpecifiedRemaining
                );
        }
    }
}
