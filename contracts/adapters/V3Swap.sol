// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/external/Uniswap/V3/IUniswapV3Factory.sol";
import "../interfaces/external/Uniswap/V3/IUniswapV3Pool.sol";
import "../libraries/Path.sol";
import "../libraries/Quoter.sol";
import "./BaseAdapter.sol";

contract V3Swap is BaseAdapter {
    using Path for bytes;
    using SafeCast for uint256;
    using TransferHelper for address;

    event FeeAmountsUpdated(uint24[] indexed feeAmounts);

    bytes32 private constant POOL_INIT_CODE_HASH =
        0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54;

    IUniswapV3Factory public immutable factory;

    uint24[] private feeAmounts;

    constructor(
        bytes32 _id,
        address _weth,
        address _factory
    ) BaseAdapter(_id, _weth) {
        factory = IUniswapV3Factory(_factory);

        feeAmounts.push(100);
        feeAmounts.push(500);
        feeAmounts.push(3000);
        feeAmounts.push(10000);
    }

    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external {
        require(amount0Delta > 0 || amount1Delta > 0);

        (address tokenIn, address tokenOut, uint24 fee) = data
            .decodeFirstPool();

        address pool = computePoolAddress(tokenIn, tokenOut, fee);

        if (msg.sender != pool) revert InvalidPool();

        uint256 amountToPay = amount0Delta > 0
            ? uint256(amount0Delta)
            : uint256(amount1Delta);

        tokenIn.safeTransfer(pool, amountToPay);
    }

    function getPool(
        address tokenA,
        address tokenB
    ) external view returns (address pool) {
        (pool, ) = getPoolWithMostLiquidity(tokenA, tokenB);
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

        (address pool, uint24 fee) = getPoolWithMostLiquidity(
            tokenIn,
            tokenOut
        );

        if (pool == address(0)) revert PoolNotFound();

        bool zeroForOne = tokenIn < tokenOut;

        (int256 amount0, int256 amount1) = IUniswapV3Pool(pool).swap(
            recipient,
            zeroForOne,
            amountIn.toInt256(),
            zeroForOne
                ? TickMath.MIN_SQRT_RATIO + 1
                : TickMath.MAX_SQRT_RATIO - 1,
            abi.encodePacked(tokenIn, fee, tokenOut)
        );

        amountOut = uint256(-(zeroForOne ? amount1 : amount0));
    }

    function _query(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view override returns (uint256 amountOut) {
        (address pool, uint24 fee) = getPoolWithMostLiquidity(
            tokenIn,
            tokenOut
        );

        if (pool == address(0)) return 0;

        bool zeroForOne = tokenIn < tokenOut;

        (int256 amount0, int256 amount1) = Quoter.quote(
            IUniswapV3Pool(pool),
            fee,
            zeroForOne,
            amountIn.toInt256()
        );

        return uint256(-(zeroForOne ? amount1 : amount0));
    }

    function getPoolWithMostLiquidity(
        address tokenA,
        address tokenB
    ) private view returns (address pool, uint24 fee) {
        uint24[] memory cached = feeAmounts;
        uint256 length = cached.length;

        address currentPool;
        uint128 liquidity;
        uint128 mostLiquidity;

        for (uint256 i; i < length; ) {
            currentPool = factory.getPool(tokenA, tokenB, cached[i]);

            if (address(currentPool) != address(0)) {
                liquidity = IUniswapV3Pool(currentPool).liquidity();

                if (liquidity > mostLiquidity) {
                    mostLiquidity = liquidity;
                    pool = currentPool;
                    fee = cached[i];
                }
            }

            unchecked {
                i = i + 1;
            }
        }
    }

    function computePoolAddress(
        address tokenA,
        address tokenB,
        uint24 fee
    ) private view returns (address pool) {
        if (tokenA > tokenB) (tokenA, tokenB) = (tokenB, tokenA);

        pool = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex"ff",
                            address(factory),
                            keccak256(abi.encode(tokenA, tokenB, fee)),
                            POOL_INIT_CODE_HASH
                        )
                    )
                )
            )
        );
    }

    function getFeeAmounts() external view returns (uint24[] memory) {
        return feeAmounts;
    }

    function setFeeAmounts(uint24[] memory fees) external onlyOwner {
        require(fees.length >= 4);
        feeAmounts = fees;

        emit FeeAmountsUpdated(fees);
    }
}
