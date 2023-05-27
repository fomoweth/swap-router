// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IAdapter.sol";
import "../libraries/TransferHelper.sol";
import "../utils/Ownable.sol";
import "../utils/Wrapper.sol";

abstract contract BaseAdapter is IAdapter, Ownable, Wrapper {
    using TransferHelper for address;

    error IdenticalAddresses();
    error InvalidPool();
    error InsufficientAmountIn();
    error PoolNotFound();

    bytes32 public immutable id;

    constructor(bytes32 _id, address _weth) Wrapper(_weth) {
        id = _id;
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) external payable returns (uint256 amountOut) {
        if (tokenIn == tokenOut) revert IdenticalAddresses();
        if (amountIn == 0) revert InsufficientAmountIn();

        return _swap(tokenIn, tokenOut, amountIn, recipient);
    }

    function query(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        if (tokenIn == tokenOut || amountIn == 0) {
            return 0;
        }

        return _query(tokenIn, tokenOut, amountIn);
    }

    function sweepTokens(address token, address recipient) external onlyOwner {
        token.safeTransfer(recipient, token.getBalance(address(this)));
    }

    function _swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) internal virtual returns (uint256 amountOut);

    function _query(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view virtual returns (uint256 amountOut);
}
