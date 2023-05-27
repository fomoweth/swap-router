// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/external/Curve/ICurveAddressProvider.sol";
import "../interfaces/external/Curve/ICurveRegistry.sol";
import "../interfaces/external/Curve/ICurvePool.sol";
import "../libraries/RevertMessage.sol";
import "./BaseAdapter.sol";

contract CurveSwap is BaseAdapter {
    using TransferHelper for address;

    uint256 private constant STABLE_REGISTRY_ID = 0;
    uint256 private constant FACTORY_REGISTRY_ID = 3;
    uint256 private constant CRYPTO_REGISTRY_ID = 5;

    address public immutable stableRegistry;
    address public immutable factoryRegistry;
    address public immutable cryptoRegistry;

    constructor(
        bytes32 _id,
        address _weth,
        ICurveAddressProvider _addressProvider
    ) BaseAdapter(_id, _weth) {
        stableRegistry = _addressProvider.get_address(STABLE_REGISTRY_ID);
        factoryRegistry = _addressProvider.get_address(FACTORY_REGISTRY_ID);
        cryptoRegistry = _addressProvider.get_address(CRYPTO_REGISTRY_ID);
    }

    function getPool(
        address tokenA,
        address tokenB
    ) external view returns (address pool) {
        (, pool, , , ) = getPoolConfig(tokenA, tokenB);
    }

    function _swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) internal override returns (uint256 amountOut) {
        (
            bool isCryptoPool,
            address pool,
            int128 i,
            int128 j,
            bool isUnderlying
        ) = getPoolConfig(tokenIn, tokenOut);

        if (pool == address(0)) {
            revert PoolNotFound();
        }

        bool useEth = tokenIn.isNative();
        if (!useEth) tokenIn.tryApprove(pool, amountIn);

        bytes4 signature = isCryptoPool ? bytes4(0x5b41b908) : !isUnderlying
            ? bytes4(0x3df02124)
            : bytes4(0xa6417ed6);

        (bool success, bytes memory returnData) = pool.call{
            value: useEth ? amountIn : 0
        }(abi.encodeWithSelector(signature, i, j, amountIn, 0));

        if (!success) revert(RevertMessage.get(returnData));

        amountOut = tokenOut.getBalance(address(this));

        tokenOut.safeTransfer(recipient, amountOut);
    }

    function _query(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view override returns (uint256 amountOut) {
        (
            bool isCryptoPool,
            address pool,
            int128 i,
            int128 j,
            bool isUnderlying
        ) = getPoolConfig(tokenIn, tokenOut);

        if (pool == address(0)) {
            return 0;
        }

        bytes4 signature = isCryptoPool ? bytes4(0x556d6e9f) : !isUnderlying
            ? bytes4(0x5e0d443f)
            : bytes4(0x07211ef7);

        (bool success, bytes memory returnData) = pool.staticcall(
            abi.encodeWithSelector(signature, i, j, amountIn)
        );

        if (!success) revert(RevertMessage.get(returnData));

        amountOut = abi.decode(returnData, (uint256));
    }

    function getPoolConfig(
        address tokenA,
        address tokenB
    )
        public
        view
        returns (
            bool isCryptoPool,
            address pool,
            int128 i,
            int128 j,
            bool isUnderlying
        )
    {
        address[3] memory registries = [
            cryptoRegistry,
            stableRegistry,
            factoryRegistry
        ];

        address registry;

        for (uint256 idx; idx < 3; ) {
            registry = registries[idx];

            pool = ICurveRegistry(registry).find_pool_for_coins(tokenA, tokenB);

            if (pool != address(0)) {
                (bool success, bytes memory returnData) = registry.staticcall(
                    abi.encodeWithSelector(
                        bytes4(0xeb85226d),
                        pool,
                        tokenA,
                        tokenB
                    )
                );

                if (!success) revert(RevertMessage.get(returnData));

                if (registry == stableRegistry) {
                    (i, j, isUnderlying) = abi.decode(
                        returnData,
                        (int128, int128, bool)
                    );
                } else if (registry == factoryRegistry) {
                    (i, j, ) = abi.decode(returnData, (int128, int128, bool));
                    isUnderlying = ICurveRegistry(registry).is_meta(pool);
                } else {
                    (i, j) = abi.decode(returnData, (int128, int128));
                    isCryptoPool = true;
                }

                break;
            }

            unchecked {
                idx = idx + 1;
            }
        }
    }
}
