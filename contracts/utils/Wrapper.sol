// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Wrapper {
    address public immutable WETH;

    constructor(address _weth) {
        WETH = _weth;
    }

    function wrap(uint256 value) internal {
        address weth = WETH;

        assembly {
            let ptr := mload(0x40)

            mstore(
                ptr,
                0xd0e30db000000000000000000000000000000000000000000000000000000000
            )

            if iszero(call(gas(), weth, value, ptr, 0x4, 0, 0)) {
                revert(0, 0)
            }
        }
    }

    function unwrap(uint256 value) internal {
        address weth = WETH;

        assembly {
            let ptr := mload(0x40)

            mstore(
                ptr,
                0x2e1a7d4d00000000000000000000000000000000000000000000000000000000
            )
            mstore(add(ptr, 4), value)

            if iszero(call(gas(), weth, 0, ptr, 0x24, 0, 0)) {
                revert(0, 0)
            }
        }
    }

    function isWETH(address token) internal view returns (bool) {
        return WETH == token;
    }

    receive() external payable virtual {}
}
