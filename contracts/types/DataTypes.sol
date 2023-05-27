// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct Quote {
    address adapter;
    address tokenIn;
    address tokenOut;
    uint256 amountOut;
}

struct Query {
    address[] adapters;
    address[] path;
    uint256[] amounts;
}

struct RawQuery {
    bytes adapters;
    bytes path;
    bytes amounts;
}

struct Route {
    address[] adapters;
    address[] path;
}
