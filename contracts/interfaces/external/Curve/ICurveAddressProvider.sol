// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurveAddressProvider {
    struct AddressInfo {
        address addr;
        bool is_active;
        uint256 version;
        uint256 last_modified;
        string description;
    }

    function get_registry() external view returns (address);

    function get_address(uint256 id) external view returns (address);

    function get_id_info(uint256 id) external view returns (AddressInfo memory);

    function max_id() external view returns (uint256);
}
