// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleDAO_Guard {
    mapping(address => uint) public balances;
    bool private locked;

    modifier nonReentrant() {
        require(!locked, "Reentrancy not allowed");
        locked = true;
        _;
        locked = false;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint amount) public nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Interaction
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        // Effect
        balances[msg.sender] -= amount;
    }
}
