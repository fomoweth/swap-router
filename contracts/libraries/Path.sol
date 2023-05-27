// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Path {
    error Overflow();
    error OutOfBounds();

    uint256 private constant ADDR_SIZE = 20;
    uint256 private constant FEE_SIZE = 3;
    uint256 private constant NEXT_OFFSET = ADDR_SIZE + FEE_SIZE;
    uint256 private constant POP_OFFSET = NEXT_OFFSET + ADDR_SIZE;
    uint256 private constant MULTIPLE_POOLS_MIN_LENGTH =
        POP_OFFSET + NEXT_OFFSET;

    function hasMultiplePools(bytes memory path) internal pure returns (bool) {
        return path.length >= MULTIPLE_POOLS_MIN_LENGTH;
    }

    function numPools(bytes memory path) internal pure returns (uint256) {
        return ((path.length - ADDR_SIZE) / NEXT_OFFSET);
    }

    function decodeFirstPool(
        bytes memory path
    ) internal pure returns (address tokenA, address tokenB, uint24 fee) {
        tokenA = toAddress(path, 0);
        fee = toUint24(path, ADDR_SIZE);
        tokenB = toAddress(path, NEXT_OFFSET);
    }

    function getFirstPool(
        bytes memory path
    ) internal pure returns (bytes memory) {
        return slice(path, 0, POP_OFFSET);
    }

    function skipToken(bytes memory path) internal pure returns (bytes memory) {
        return slice(path, NEXT_OFFSET, path.length - NEXT_OFFSET);
    }

    function slice(
        bytes memory data,
        uint256 offset,
        uint256 length
    ) internal pure returns (bytes memory result) {
        if (length + 31 < length || offset + length < offset) revert Overflow();
        if (data.length < offset + length) revert OutOfBounds();

        assembly {
            switch iszero(length)
            case 0 {
                result := mload(0x40)
                let lengthmod := and(length, 31)
                let mc := add(
                    add(result, lengthmod),
                    mul(0x20, iszero(lengthmod))
                )
                let end := add(mc, length)

                for {
                    let cc := add(
                        add(add(data, lengthmod), mul(0x20, iszero(lengthmod))),
                        offset
                    )
                } lt(mc, end) {
                    mc := add(mc, 0x20)
                    cc := add(cc, 0x20)
                } {
                    mstore(mc, mload(cc))
                }

                mstore(result, length)
                mstore(0x40, and(add(mc, 31), not(31)))
            }
            default {
                result := mload(0x40)
                mstore(result, 0)
                mstore(0x40, add(result, 0x20))
            }
        }
    }

    function toAddress(
        bytes memory data,
        uint256 offset
    ) internal pure returns (address result) {
        if (offset + 20 < offset) revert Overflow();
        if (data.length < offset + 20) revert OutOfBounds();

        assembly {
            result := div(
                mload(add(add(data, 0x20), offset)),
                0x1000000000000000000000000
            )
        }
    }

    function toUint24(
        bytes memory data,
        uint256 offset
    ) internal pure returns (uint24 result) {
        if (offset + 3 < offset) revert Overflow();
        if (data.length < offset + 3) revert OutOfBounds();

        assembly {
            result := mload(add(add(data, 0x3), offset))
        }
    }
}
