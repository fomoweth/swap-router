// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurveRegistry {
    function find_pool_for_coins(
        address from,
        address to
    ) external view returns (address pool);

    function find_pool_for_coins(
        address from,
        address to,
        uint256 poolId
    ) external view returns (address pool);

    function address_provider() external view returns (address);

    function gauge_controller() external view returns (address);

    function get_coin(uint256 id) external view returns (address);

    function coin_count() external view returns (uint256);

    function pool_list(uint256 id) external view returns (address pool);

    function pool_count() external view returns (uint256);

    function get_lp_token(address pool) external view returns (address lpToken);

    function get_pool_from_lp_token(
        address lpToken
    ) external view returns (address pool);

    function get_n_coins(
        address pool
    ) external view returns (uint256[2] memory);

    function get_coins(
        address pool
    ) external view returns (address[8] memory coins);

    function get_underlying_coins(
        address pool
    ) external view returns (address[8] memory underlyingCoins);

    function get_coin_indices(
        address pool,
        address from,
        address to
    ) external view returns (int128 i, int128 j, bool isUnderlying);

    function is_meta(address pool) external view returns (bool);

    function get_gauges(
        address pool
    )
        external
        view
        returns (address[10] memory gauges, int128[10] memory gaugeTypes);
}
