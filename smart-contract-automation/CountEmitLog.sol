// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

// This contract emits an event and is the source of the log data. 
// The purpose of this contract is to emit a log when the emitCountLog function is called.
// This contract is deployed at 0x2390639E34bE0a94693d5326F8AbE73264bC9CC9

contract CountEmitLog {
    event WantsToCount(address indexed msgSender);

    constructor() {}

    // When you call the emitCountLog function, it will emit the WantsToCount event, 
    // containing the address of the sender (msg.sender), and this log is stored in the blockchain
    function emitCountLog() public {
        emit WantsToCount(msg.sender);
    }
}
