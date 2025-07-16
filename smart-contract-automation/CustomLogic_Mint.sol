// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Deployed at contract address (Sepolia): 0xB15B83f0f0805434799dC251eb5578cb979Dd360

import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MintingWithUpkeep is ERC20, KeeperCompatibleInterface {
    uint256 public totalMinted;
    //uint256 public maxMintable = 1000000 * 10**18; // 1 million tokens
    uint256 public maxMintable = 1000; // 1000
    bool public mintingStopped = false;
    uint256 public lastChecked;

    constructor() ERC20("MintableToken", "MTK") {
        lastChecked = block.timestamp;
    }

    // Minting function
    function mint(address to, uint256 amount) external {
        require(!mintingStopped, "Minting has stopped");
        //require(totalMinted + amount <= maxMintable, "Max mintable limit reached");

        _mint(to, amount);
        totalMinted += amount;
    }

    // Function to stop minting, callable by the keeper
    function stopMinting() internal {
        mintingStopped = true;
    }

    // Check upkeep function - checks whether minting should be stopped
    function checkUpkeep(bytes calldata) external override returns (bool upkeepNeeded, bytes memory) {
        uint256 currentTotalMinted = totalMinted;
        bool isMintingStopped = mintingStopped;

        // Condition to check if minting cap is reached and minting hasn't been stopped yet
        upkeepNeeded = !isMintingStopped && currentTotalMinted >= maxMintable;
        return (upkeepNeeded, bytes("Minting cap reached or minting stopped"));
    }

    // Perform upkeep function - stops minting if condition is met
    function performUpkeep(bytes calldata) external override {
        uint256 currentTotalMinted = totalMinted;

        // Perform the upkeep logic: stop minting once the cap is reached
        if (currentTotalMinted >= maxMintable) {
            stopMinting(); // Stop minting if the cap is reached
        }
    }
}
