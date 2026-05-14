// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SharedWalletLibraryFixed {
    address public owner;

    // Prevent direct initialization of the library itself by setting owner to a non-zero address
    constructor() {
        owner = address(this); // Lock the library's own storage
    }

    function initWallet(address _owner) public {
        // Prevent proxy from re-initializing and library from being initialized directly
        require(owner == address(0), "Already initialized");
        owner = _owner;
    }

    function execute(address target, uint value, bytes memory data) public {
        require(msg.sender == owner, "Only owner can execute");
        (bool success, ) = target.call{value: value}(data);
        require(success, "Execution failed");
    }
    
    // The selfdestruct / killLibrary function is completely removed to prevent bytecode destruction
}
