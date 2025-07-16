// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol"; 
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


// This is a more efficient version of contract stakeNFT.sol 
// How to run?
// 1) Deploy staking contract (it automatically deploys MyERC20 and MyNFT)
// 2) Mint some NFTs to users
// 3) User must approve their NFTs before staking: use approve function from MyNFT contract 
//    Can be loaded with the contract address)
// 4) Now user can stake and withdraw NFT from stakingcontract
// 5) Call function accruedRewards() to check current rewards

// We discussed the assignment on Wednesday October 16th
// 3 suggestions for improvements:
// 1. In MintNFTERC20.sol should not be a holder of the ERC20 tokens, so
// when a users sends 10 ERC20 for the NFT, the authority contract burns these tokens.
// 2. In stakeNFT.sol: users can only stake 1 NFT, so allow for possibility of staking more (nested mapping)
// 3. In stakeNFT.sol: combine accrued and withdraw functions


// Step 1: Create ERC20 contract 
contract MyERC20 is ERC20, Ownable(msg.sender) {

    // Deploy contract with initial supply and set staking contract as the owner
    constructor(uint256 initialSupply, address stakingContract) ERC20("Metana Token", "METANA") {
        // Mint the initial supply to the contract deployer
        _mint(stakingContract, initialSupply);

        // Transfer ownership to the staking contract
        transferOwnership(stakingContract);
    }    

    // Function to mint additional tokens by the staking contract, so staking contract = owner
    function mintTokensToAddress(address recipient, uint256 amount) external onlyOwner {
        _mint(recipient, amount);
    }
} 

// Step 2: Use Youtube tutorial as guidance for NFT and staking contract
contract MyNFT is ERC721, Ownable(msg.sender) {

    address public stakingContract;

    mapping(uint256 => address) public originalOwner; // Keep track of the owners who deposit their NFT

    // Set authority and transfer ownership
    constructor(address authority) ERC721("My NFT", "NFT") {
        transferOwnership(authority);  // Set authority as the owner
    }
 

    //Set Maximum for the number of NFTs
    uint256 public constant MAX_SUPPLY_NFT = 10;
    uint256 public currentTokenId = 0; // Starts minting from tokenID = 0 and increment with 1 

    // Mint function with auto-incrementing tokenId
    function mintNFTToAddress(address to) external onlyOwner {

        require(currentTokenId < MAX_SUPPLY_NFT, "Maximum number of NFTs reached!");
        
        // Mint the NFT with the current tokenId
        _safeMint(to, currentTokenId);
        
        // Increment the tokenId for the next mint
        currentTokenId++;
    }


}

// STEP 3: CREATE STAKING CONTRACT AND USE IT TO DEPLOY BOTH CONTRACTS ABOVE 
contract StakingContract is Ownable(msg.sender), IERC721Receiver  {

    MyERC20 public erc20Token;
    MyNFT public nftContract;

    // Mapping to track staked NFTs and their owners
    // TokenID uint256 ==> address 
    mapping(uint256 => address) public originalOwner;

    // Keep track of time of staking entry
    // Here we need nested mapping because user can stake more NFTs 
    // (user => NFT ID => time of staking)
    mapping(address => mapping(uint256 => uint256)) public timeEntryStaking;



    // This declares an interface variable itemNFT of type IERC721. 
    // IERC721 is an interface that allows the contract to interact with any ERC721 token
    // Needed for safeTransferFrom for instance!
    //IERC721 public itemNFT;

    // Constructor below deploys both ERC20 and ERC721 contracts from above
    constructor(uint256 initialSupply) {
        
        // Deploy the ERC20 token and NFT contract
        erc20Token = new MyERC20(initialSupply, address(this));
        nftContract = new MyNFT(address(this));


    }

    // Mint ERC20 tokens (only callable by the stakingcontract)
    function mintERC20(address to, uint256 amount) external onlyOwner {
        erc20Token.mintTokensToAddress(to, amount);  // Calls the mint function on the ERC20 contract
    }

    // Mint NFTs (only callable by the stakingcontract)
    function mintNFT(address to) external  onlyOwner {
        nftContract.mintNFTToAddress(to);  // Calls the mintNFT function on the ERC721 contract
    }

 


     // This function is required to allow the contract to receive NFTs
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {
        originalOwner[tokenId] = from; // Keep track of owners
        timeEntryStaking[from][tokenId] = block.timestamp;
        return IERC721Receiver.onERC721Received.selector;
    }
 
    // Step 3: Monitor time in staking
    // Functions to monitor time of entry and exit of the staking
    //uint256 private constant SECONDS_PER_DAY = 86400; // 24 hours in seconds
    //uint256 private constant REWARDS_PER_DAY = 10 * 10 ** 18;
    //uint256 private constant SECONDS_PER_DAY = 24 * 60 * 60; // 24 hours in seconds
    uint256 private constant SECONDS_PER_DAY = 5; // 24 hours in seconds
    uint256 private constant REWARDS_PER_DAY = 10 * 10 ** 18;
    mapping(address => mapping(uint256 => uint256)) public rewardsAccrued; // accrued rewards (also nested mapping)
    mapping(address => mapping(uint256 => uint256)) public lastWithdrawal; // last withdrawal (also nested mapping)
    mapping(address => mapping(uint256 => uint256)) public timeSinceClaim; // time since last withdrawal (also nested mapping)


    // Some testvariables (comment out later)
    uint256 public currentTime;
    uint256 public timeInterval;
    uint256 public timeElapsed;
    uint256 public rewards;

function withdrawAccruedRewards(uint256 tokenId) external payable {
    
    
    require(timeEntryStaking[msg.sender][tokenId] > 0, "No staking entry found for this address and this NFT");

    // Current time
    currentTime = block.timestamp;

    // Calculate time elapsed since staking or last claimed
    if (lastWithdrawal[msg.sender][tokenId] == 0) {
        // First time to claim
        timeInterval = timeEntryStaking[msg.sender][tokenId];
    } else {
        // Not the first claim
        timeInterval = lastWithdrawal[msg.sender][tokenId];
    }

    // timeInterval, periodStaked is determined for each call of the function for each tokenID
    timeElapsed = currentTime - timeInterval;

    // Calculate the period staked
    uint256 periodStaked = timeElapsed / SECONDS_PER_DAY;
    rewards = periodStaked * REWARDS_PER_DAY;

    // Rewards need to be positive
    require(rewards > 0, "No rewards available to withdraw");

    // Only 1 claim per 24 hours
    require((currentTime - lastWithdrawal[msg.sender][tokenId]) > SECONDS_PER_DAY, "1 claim per day allowed");

    // Mint the rewards tokens (ERC20) directly to the user's wallet
    erc20Token.mintTokensToAddress(msg.sender, rewards);

    // Update the last withdrawal time
    lastWithdrawal[msg.sender][tokenId] = currentTime;

    // Reset accrued rewards after withdrawal
    rewardsAccrued[msg.sender][tokenId] = 0;
}



      // Function to stake an NFT
    function stakeNFT(uint256 tokenId) external {
        // Transfer the NFT from the user to this contract
        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        // Record the owner of the staked NFT
        originalOwner[tokenId] = msg.sender;
    }

    // Function to withdraw an NFT
    function withdrawNFT(uint256 tokenId) external {
        require(originalOwner[tokenId] == msg.sender, "You are not the owner of this staked NFT");

        // Transfer the NFT back to the owner
        nftContract.safeTransferFrom(address(this), msg.sender, tokenId);

        // Remove the record of the staked NFT
        delete originalOwner[tokenId];
    }

}