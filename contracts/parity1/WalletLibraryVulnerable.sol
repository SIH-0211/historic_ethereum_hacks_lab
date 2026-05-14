// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// FOR LOCAL EDUCATIONAL PURPOSES ONLY.
contract WalletLibraryVulnerable {
    address public owner;

    function initWallet(address _owner) public {
        owner = _owner;
    }

    function execute(address target, uint value, bytes memory data) public {
        require(msg.sender == owner, "Only owner can execute");
        (bool success, ) = target.call{value: value}(data);
        require(success, "Execution failed");
    }
}
