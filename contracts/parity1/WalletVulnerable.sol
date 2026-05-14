// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// FOR LOCAL EDUCATIONAL PURPOSES ONLY.
contract WalletVulnerable {
    address public owner;
    address public libraryAddress;

    constructor(address _libraryAddress) {
        libraryAddress = _libraryAddress;
    }

    receive() external payable {}

    fallback() external payable {
        address _lib = libraryAddress;
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), _lib, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
