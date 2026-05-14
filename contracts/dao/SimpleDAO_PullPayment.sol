// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleDAO_PullPayment {
    mapping(address => uint) public balances;
    mapping(address => uint) public pendingWithdrawals;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function initiateWithdrawal(uint amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        // State update
        balances[msg.sender] -= amount;
        // Record pending payment
        pendingWithdrawals[msg.sender] += amount;
    }

    function claimPayment() public {
        uint amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending payment");
        
        // Effect first
        pendingWithdrawals[msg.sender] = 0;
        
        // Interaction last
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
