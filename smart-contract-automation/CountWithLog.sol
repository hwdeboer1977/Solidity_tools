// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

// This contract is more complex, and it interacts with the event logs emitted by the CountEmitLog contract. 
// It implements the Chainlink Automation Interface (ILogAutomation), which allows it to trigger actions based on the emitted logs.

struct Log {
    uint256 index; // Index of the log in the block
    uint256 timestamp; // Timestamp of the block containing the log
    bytes32 txHash; // Hash of the transaction containing the log
    uint256 blockNumber; // Number of the block containing the log
    bytes32 blockHash; // Hash of the block containing the log
    address source; // Address of the contract that emitted the log
    bytes32[] topics; // Indexed topics of the log
    bytes data; // Data of the log
}

// Define the interface for Log Automation
interface ILogAutomation {
    function checkLog(
        Log calldata log,
        bytes memory checkData
    ) external returns (bool upkeepNeeded, bytes memory performData);

    function performUpkeep(bytes calldata performData) external;
}

contract CountWithLog is ILogAutomation {
    // Define an event to log that an action was performed
    event CountedBy(address indexed msgSender);

    uint256 public counted = 0; // A counter to keep track of how many times something has been counted

    constructor() {}

    // Implement the checkLog function to inspect logs and decide if upkeep is needed
    function checkLog(
        Log calldata log,
        bytes memory
    ) external pure returns (bool upkeepNeeded, bytes memory performData) {
        
        // This function checks the log data and decides if upkeep is needed (returns true if upkeep is needed)
        upkeepNeeded = true;
        
        // Get the address that emitted the log from the second indexed topic (topics[1])
        address logSender = bytes32ToAddress(log.topics[1]);
        
        // Return the performData, which will be the address that emitted the log
        performData = abi.encode(logSender);
    }

    // Implement the performUpkeep function to perform an action based on the log data
    function performUpkeep(bytes calldata performData) external override {

          // Increment the counted variable
        counted += 1;

        // Decode the performData to get the sender address
        address logSender = abi.decode(performData, (address));
        
        // Emit the CountedBy event, indicating that the sender triggered the upkeep
        emit CountedBy(logSender);
    }

    // Helper function to convert bytes32 to address
    function bytes32ToAddress(bytes32 _address) public pure returns (address) {
        return address(uint160(uint256(_address)));
    }
}
