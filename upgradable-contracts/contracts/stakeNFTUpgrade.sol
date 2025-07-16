// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

//import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


// NOW WE UPGRADE THE CONTRACT STAKENFT.SOL
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

// This is a more efficient version of contract stakeNFT.sol 
// How to run?
// 1) Deploy staking contract (it automatically deploys MyERC20 and MyNFT)
// 2) Mint some NFTs to users
// 3) User must approve their NFTs before staking: use approve function from MyNFT contract 
//    Can be loaded with the contract address)
// 4) Now user can stake and withdraw NFT from stakingcontract
// 5) Call function accruedRewards() to check current rewards




// Step 1: Create upgradeable ERC20 contract 
contract MyERC20 is Initializable, ERC20Upgradeable, OwnableUpgradeable {

    // Deploy contract with initial supply and set staking contract as the owner
    // constructor(uint256 initialSupply, address stakingContract) ERC20("Metana Token", "METANA") {
    //     // Mint the initial supply to the contract deployer
    //     _mint(stakingContract, initialSupply);

    //     // Transfer ownership to the staking contract
    //     transferOwnership(stakingContract);
    // }   

     function initialize(uint256 initialSupply, address stakingContract) public initializer {
        __ERC20_init("Metana Token", "METANA");
        __Ownable_init();
        _mint(stakingContract, initialSupply);
        transferOwnership(stakingContract);
    }
 

    // Function to mint additional tokens by the staking contract, so staking contract = owner
    function mintTokensToAddress(address recipient, uint256 amount) external onlyOwner {
        _mint(recipient, amount);
    }

    // Function setOwner to set ownership to stakingcontract later
    function setOwner(address stakingContract) external onlyOwner {
    transferOwnership(stakingContract);
}
} 

// Step 2: Use Youtube tutorial as guidance for NFT and staking contract
contract MyNFT is  Initializable, ERC721Upgradeable, OwnableUpgradeable {

    address public stakingContract;

    mapping(uint256 => address) public originalOwner; // Keep track of the owners who deposit their NFT

    uint256 public constant MAX_SUPPLY_NFT = 10;
    uint256 public currentTokenId;

    function initialize(address authority) public initializer {
        __ERC721_init("My NFT", "NFT");
        __Ownable_init();
        transferOwnership(authority);
        currentTokenId = 0;
    }

    // Set authority and transfer ownership
    // constructor(address authority) ERC721("My NFT", "NFT") {
    //     transferOwnership(authority);  // Set authority as the owner
    // }
 
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
contract StakingContract is Initializable, OwnableUpgradeable, IERC721Receiver  {

    MyERC20 public erc20Token;
    MyNFT public nftContract;

    // Mapping to track staked NFTs and their owners
    // TokenID uint256 ==> address 
    mapping(uint256 => address) public originalOwner;

    // Keep track of time of staking entry
    // Here we need nested mapping because user can stake more NFTs 
    // (user => NFT ID => time of staking)
    mapping(address => mapping(uint256 => uint256)) public timeEntryStaking;

    // In stakeNFT.sol the constructor automatically deployed the MyERC20 and MyNFT contracts
    // Bytecode of the code too large for update ==> Rewrite the initialize function and deploy MyERC20 and MyNFT contracts first.
    // Now initialize function accepts (already deployed) addresses of MyERC20 and MyNFT contracts as arguments. 
    // This approach links the staking contract to these contracts, avoiding unnecessary deployments.
    
    // Initialize function now accepts the addresses of pre-deployed ERC20 and NFT contracts
    function initialize(address erc20Address, address nftAddress) public initializer {
        __Ownable_init();

        // Set the addresses of the pre-deployed contracts
        erc20Token = MyERC20(erc20Address);
        nftContract = MyNFT(nftAddress);
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
    uint256 private constant SECONDS_PER_DAY = 5; // 24 hours in seconds
    uint256 private constant REWARDS_PER_DAY = 10 * 10 ** 18;
    mapping(address => mapping(uint256 => uint256)) public rewardsAccrued; // accrued rewards (also nested mapping)
    mapping(address => mapping(uint256 => uint256)) public lastWithdrawal; // last withdrawal (also nested mapping)
    mapping(address => mapping(uint256 => uint256)) public timeSinceClaim; // time since last withdrawal (also nested mapping)



    uint256 public currentTime;

    function withdrawAccruedRewards(uint256 tokenId) external payable {
        
        
        require(timeEntryStaking[msg.sender][tokenId] > 0, "No staking entry found for this address and this NFT");

        // Current time
        currentTime = block.timestamp;


        // Rewrite this more efficient to save bytecode size
        uint256 timeElapsed = block.timestamp - (
        lastWithdrawal[msg.sender][tokenId] > 0 
            ? lastWithdrawal[msg.sender][tokenId]
            : timeEntryStaking[msg.sender][tokenId]
        );
        uint256 rewards = (timeElapsed / SECONDS_PER_DAY) * REWARDS_PER_DAY;


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