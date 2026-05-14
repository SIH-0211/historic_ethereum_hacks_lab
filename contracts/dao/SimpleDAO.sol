// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// FOR LOCAL EDUCATIONAL PURPOSES ONLY.
contract SimpleDAO {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Vulnerable pattern: sending ETH via an external call before updating the internal user balance.
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        // Emulate pre-0.8 behavior so the reentrancy attack does not revert on underflow
        unchecked {
            balances[msg.sender] -= amount;
        }
    }
}
