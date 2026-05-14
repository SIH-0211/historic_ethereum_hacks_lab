// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WalletLibraryFixed {
    address public owner;
    bool public initialized;

    function initWallet(address _owner) public {
        require(!initialized, "Already initialized");
        owner = _owner;
        initialized = true;
    }

    function execute(address target, uint value, bytes memory data) public {
        require(msg.sender == owner, "Only owner can execute");
        (bool success, ) = target.call{value: value}(data);
        require(success, "Execution failed");
    }
}

contract WalletFixed {
    // Storage layout must match WalletLibraryFixed
    address public owner;
    bool public initialized;
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
