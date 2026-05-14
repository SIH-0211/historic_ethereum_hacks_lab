// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleDAO_CEI {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Checks-Effects-Interactions (CEI): Effect first
        balances[msg.sender] -= amount;
        
        // Interaction last
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
