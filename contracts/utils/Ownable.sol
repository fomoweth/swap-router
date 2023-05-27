// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Ownable {
    event OwnerUpdated(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NewOwnerZeroAddress();

    address private _owner;

    constructor() {
        _setOwner(msg.sender);
    }

    modifier onlyOwner() {
        _checkOwner(msg.sender);
        _;
    }

    function _checkOwner(address account) internal view {
        if (_owner != account) revert NotOwner();
    }

    function _setOwner(address newOwner) internal {
        if (newOwner == address(0)) revert NewOwnerZeroAddress();
        emit OwnerUpdated(_owner, newOwner);
        _owner = newOwner;
    }

    function setOwner(address newOwner) external onlyOwner {
        _setOwner(newOwner);
    }

    function owner() external view returns (address) {
        return _owner;
    }
}
