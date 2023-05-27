// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../types/DataTypes.sol";
import "./BytesLib.sol";

library QueryUtils {
    using BytesLib for address;
    using BytesLib for bytes;
    using BytesLib for uint256;

    function initialize(
        RawQuery memory rq,
        address tokenIn,
        uint256 amountIn
    ) internal pure returns (RawQuery memory) {
        rq.path = tokenIn.toBytes();
        rq.amounts = amountIn.toBytes();

        return rq;
    }

    function clone(RawQuery memory rq) internal pure returns (RawQuery memory) {
        return
            RawQuery({
                adapters: rq.adapters,
                path: rq.path,
                amounts: rq.amounts
            });
    }

    function append(
        RawQuery memory rq,
        address adapter,
        address token,
        uint256 amount
    ) internal pure {
        rq.adapters = bytes.concat(rq.adapters, adapter.toBytes());
        rq.path = bytes.concat(rq.path, token.toBytes());
        rq.amounts = bytes.concat(rq.amounts, amount.toBytes());
    }

    function getLast(
        RawQuery memory rq
    ) internal pure returns (address tokenOut, uint256 amountOut) {
        tokenOut = rq.path.toAddress(rq.path.length);
        amountOut = rq.amounts.toUint256(rq.amounts.length);
    }

    function format(RawQuery memory rq) internal pure returns (Query memory) {
        return
            Query({
                adapters: rq.adapters.arrayifyAddress(),
                path: rq.path.arrayifyAddress(),
                amounts: rq.amounts.arrayifyUint256()
            });
    }

    function append(
        Query memory q,
        address adapter,
        address token,
        uint256 amount
    ) internal pure {
        q.adapters = bytes
            .concat(abi.encodePacked(q.adapters), adapter.toBytes())
            .arrayifyAddress();

        q.path = bytes
            .concat(abi.encodePacked(q.path), token.toBytes())
            .arrayifyAddress();

        q.amounts = bytes
            .concat(abi.encodePacked(q.amounts), amount.toBytes())
            .arrayifyUint256();
    }

    function insert(
        Query memory q,
        address adapter,
        address token,
        uint256 amount
    ) internal pure {
        q.adapters = bytes
            .concat(adapter.toBytes(), abi.encodePacked(q.adapters))
            .arrayifyAddress();

        q.path = bytes
            .concat(token.toBytes(), abi.encodePacked(q.path))
            .arrayifyAddress();

        q.amounts = bytes
            .concat(amount.toBytes(), abi.encodePacked(q.amounts))
            .arrayifyUint256();
    }
}
