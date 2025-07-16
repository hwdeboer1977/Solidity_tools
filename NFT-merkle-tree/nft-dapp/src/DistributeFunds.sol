// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";


// To implement a withdrawal mechanism using the pull pattern, we can allow a designated address 
// (e.g., owner) to withdraw funds. Additionally, funds can be withdrawn to an arbitrary number of contributors 
//by maintaining a mapping of balances for each contributor. This ensures that contributors can withdraw their allocated funds independently.
contract DistributeFundsV1 {
    mapping(address => uint256) public balances; // Mapping of contributors' balances
    uint256 public totalFunds; // Tracks total funds in the contract
    address public owner; // Owner of the contract

    event FundsDeposited(address indexed contributor, uint256 amount);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Constructor to set the owner
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // Modifier to restrict access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    // Function to deposit a specific amount of funds
    function depositFunds(uint256 amount) external payable {
        require(msg.value == amount, "Sent value does not match the amount parameter");
        require(amount > 0, "Must send some Ether");

        balances[msg.sender] += amount;
        totalFunds += amount;

        emit FundsDeposited(msg.sender, amount);
    }

    // Function to withdraw funds using the pull pattern
    function withdrawFunds() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No funds to withdraw");

        // Reset the balance to prevent reentrancy attacks
        balances[msg.sender] = 0;
        totalFunds -= amount;

        // Transfer funds to the caller
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    // Owner-only function to withdraw to multiple contributors
    function distributeFunds(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Mismatched input lengths");

        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];

            require(totalFunds >= amount, "Insufficient funds");
            balances[recipient] += amount;
            totalFunds -= amount;

            emit FundsWithdrawn(recipient, amount);
        }
    }

    // View function to check the balance of a contributor
    function getBalance(address contributor) external view returns (uint256) {
        return balances[contributor];
    }

    // Owner-only function to transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}