// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IAdapter.sol";
import "./interfaces/ISwapRouter.sol";
import "./libraries/QueryUtils.sol";
import "./libraries/TransferHelper.sol";
import "./utils/Deadline.sol";
import "./utils/Ownable.sol";
import "./utils/ReentrancyGuard.sol";
import "./utils/Wrapper.sol";

contract SwapRouter is
    ISwapRouter,
    Deadline,
    Ownable,
    ReentrancyGuard,
    Wrapper
{
    using QueryUtils for Query;
    using QueryUtils for RawQuery;
    using TransferHelper for address;

    error InsufficientAmountOut();
    error MaxHopOutOfRange();

    uint256 private constant MAX_HOP_LIMIT = 3;

    address[] private _adapters;
    address[] private _bridgeTokens;

    constructor(address _weth) Wrapper(_weth) {}

    function swap(
        Route memory route,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient,
        uint256 deadline
    ) external payable checkDeadline(deadline) returns (uint256 amountOut) {
        bool useEth = route.path[0].isNative();

        route.path[0].safeTransferFrom(msg.sender, route.adapters[0], amountIn);

        uint256 length = route.adapters.length;

        for (uint256 i; i < length; ) {
            amountIn = IAdapter(route.adapters[i]).swap{
                value: useEth ? amountIn : 0
            }(
                route.path[i],
                route.path[i + 1],
                amountIn,
                i < length - 1 ? route.adapters[i + 1] : recipient
            );

            unchecked {
                i = i + 1;
            }
        }

        amountOut = amountIn;

        if (amountOut < amountOutMin) revert InsufficientAmountOut();
    }

    function quote(
        address adapter,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (Quote memory q) {
        q = Quote({
            adapter: adapter,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountOut: IAdapter(adapter).query(tokenIn, tokenOut, amountIn)
        });
    }

    function quote(
        uint8[] memory adapterIds,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (Quote memory q) {
        address[] memory cached = _adapters;
        uint256 length = adapterIds.length;

        for (uint256 i; i < length; ) {
            uint256 amountOut = IAdapter(cached[adapterIds[i]]).query(
                tokenIn,
                tokenOut,
                amountIn
            );

            if (i == 0 || amountOut > q.amountOut) {
                q = Quote({
                    adapter: cached[adapterIds[i]],
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    amountOut: amountOut
                });
            }

            unchecked {
                i = i + 1;
            }
        }
    }

    function quote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (Quote memory q) {
        address[] memory cached = _adapters;
        uint256 length = cached.length;

        for (uint256 i; i < length; ) {
            uint256 amountOut = IAdapter(cached[i]).query(
                tokenIn,
                tokenOut,
                amountIn
            );

            if (i == 0 || amountOut > q.amountOut) {
                q = Quote({
                    adapter: cached[i],
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    amountOut: amountOut
                });
            }

            unchecked {
                i = i + 1;
            }
        }
    }

    function query(
        uint8 maxHop,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (Query memory) {
        if (maxHop == 0 || maxHop > MAX_HOP_LIMIT) {
            revert MaxHopOutOfRange();
        }

        RawQuery memory rq;

        rq = _query(
            maxHop,
            tokenIn,
            tokenOut,
            amountIn,
            rq.initialize(tokenIn, amountIn)
        );

        if (rq.adapters.length == 0) {
            rq.path = new bytes(0);
            rq.amounts = new bytes(0);
        }

        return rq.format();
    }

    function _query(
        uint8 maxHop,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        RawQuery memory rq
    ) internal view returns (RawQuery memory result) {
        result = rq.clone();

        uint256 amountOut;

        // check if there's a direct path from tokenIn to tokenOut
        Quote memory direct = quote(tokenIn, tokenOut, amountIn);

        if (direct.amountOut != 0) {
            result.append(direct.adapter, direct.tokenOut, direct.amountOut);
            amountOut = direct.amountOut;
        }

        // check the number of hops to perform before the iteration
        if (maxHop > 1 && rq.adapters.length / 32 <= maxHop - 2) {
            // check for the paths acrossing the bridge tokens
            address[] memory tokens = _bridgeTokens;
            uint256 length = tokens.length;

            for (uint256 i; i < length; ) {
                // skip if tokenIn is equal to the current bridge token
                if (tokenIn != tokens[i]) {
                    // iterate thru all adapters to define which one offers the most tokens in return
                    Quote memory q = quote(tokenIn, tokens[i], amountIn);

                    // determine whether the current path is connected to the tokenOut or not
                    if (q.amountOut != 0) {
                        RawQuery memory cached = rq.clone();

                        cached.append(q.adapter, q.tokenOut, q.amountOut);

                        // recursive step
                        cached = _query(
                            maxHop,
                            tokens[i],
                            tokenOut,
                            q.amountOut,
                            cached
                        );

                        // check if the last element of the queries is equal to tokenOut and update the states if necessary
                        (address _tokenOut, uint256 _amountOut) = cached
                            .getLast();

                        if (_tokenOut == tokenOut && _amountOut > amountOut) {
                            result = cached;
                            amountOut = _amountOut;
                        }
                    }
                }

                unchecked {
                    i = i + 1;
                }
            }
        }
    }

    function getAdapters() external view returns (address[] memory) {
        return _adapters;
    }

    function getAdaptersCount() external view returns (uint256) {
        return _adapters.length;
    }

    function setAdapters(address[] memory adapters) external onlyOwner {
        _adapters = adapters;

        emit AdaptersUpdated(adapters);
    }

    function getBridgeTokens()
        external
        view
        returns (address[] memory bridgeTokens)
    {
        return _bridgeTokens;
    }

    function getBridgeTokensCount() external view returns (uint256) {
        return _bridgeTokens.length;
    }

    function setBridgeTokens(address[] memory bridgeTokens) external onlyOwner {
        _bridgeTokens = bridgeTokens;

        emit BridgeTokensUpdated(bridgeTokens);
    }
}
