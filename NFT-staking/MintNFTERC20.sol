// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// We need 3 contracts: 
// Contract 1: MyERCToken: ERC20 contract for new token
// Contract 2: MyNFT: ERC721 contract for NFT
// Contract 3: AuthorityContract: Smart contract Authority that can receive ERC20 and mint NFTs


// HOW TO RUN THE CODE
// Deploy the AuthorityContract: it automatically deploys the other 2 contracts
// Get the address erc20Token and nftContract (see below)
// You can access them with 'At Address" button below deploy
// User must approve ERC20 token manually (approve authority CA as spender)
// User should send ERC20 token to authority contract
// User will receive the NFT in return (no need to claim)


// STEP 1: CREATE AN ERC20 CONTRACT (standard 18 decimals)
contract MyERCToken is ERC20, Ownable(msg.sender) {

    // Assignment is to transfer ownership to a smart contract called authority 
    // At first I used transferOwnership(authority) but then you transfer ownership to an EOA
    // Now the 3rd contract deploys contract 1 and 2 together (using NEW keyword)
    
    // Constructor accepts the authority address as the owner
    constructor(uint256 initialSupply, address authority) ERC20("Gold", "GLD")  {
        _mint(authority, initialSupply);
        transferOwnership(authority);  // Set authority as the owner
    }

    // Set max supply
    uint256 public constant MAX_SUPPLY = 1000000 * 10 ** 18;


    // Only the authority can mint tokens
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply reached!");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
    require(balanceOf(from) >= amount, "Insufficient balance to burn");

    _burn(from, amount);
}
}

// STEP 2: CREATE AN ERC721 CONTRACT 
// Contract 2: ERC 721 contract (NFT)
contract MyNFT is ERC721, Ownable(msg.sender) {

    constructor(address authority) ERC721("NFT to buy with ERC20", "METANA") {
        transferOwnership(authority);  // Set authority as the owner
    }

    //Set Maximum for the number of NFTs
    uint256 public constant MAX_SUPPLY_NFT = 100;
    uint256 public currentTokenId = 0; // Starts minting from tokenID = 0 and increment with 1 

    // Mint function with auto-incrementing tokenId
    function mintNFT(address to) external onlyOwner {

        require(currentTokenId < MAX_SUPPLY_NFT, "Maximum number of NFTs reached!");
        
        // Mint the NFT with the current tokenId
        _safeMint(to, currentTokenId);
        
        // Increment the tokenId for the next mint
        currentTokenId++;
    }
}

// STEP 3: CREATE AN AUTHORITY CONTRACT AND USE IT TO DEPLOY BOTH CONTRACTS ABOVE 
// Contract 3: Authority contract
contract AuthorityContract is Ownable(msg.sender) {

    MyERCToken public erc20Token;
    MyNFT public nftContract;

    // Constructor below deploys both ERC20 and ERC721 contracts from above
    constructor(uint256 initialSupply) {
        // Deploy the ERC20 token and NFT contract
        erc20Token = new MyERCToken(initialSupply, address(this));
        nftContract = new MyNFT(address(this));

    }

    

    // STEP 4: MAKE FUNCTIONS BELOW PAYABLE  
    // Use payable on functions when you want specific functions to accept Ether
    // Alternative is to use the receive() function: use to accept Ether directly, without calling any function.


    // Mint ERC20 tokens (only callable by the owner of the authority)
    function mintERC20(address to, uint256 amount) external onlyOwner {
        erc20Token.mint(to, amount);  // Calls the mint function on the ERC20 contract
    }

    // Mint NFTs (only callable by the owner of the authority)
    function mintNFT(address to) external  onlyOwner {
        nftContract.mintNFT(to);  // Calls the mintNFT function on the ERC721 contract
    }


    
    // STEP 5 SEND ERC20 TOKEN AND RECEIVE NFT
     uint256 public constant PRICE_NFT = 10 * 10 ** 18;
   

    // Deposit function to exchange 10 ERC20 tokens for 1 NFT
    function depositTokensForNFT() external {
        
        // Check if the user has approved the contract to spend 10 tokens
        require(erc20Token.allowance(msg.sender, address(this)) >= PRICE_NFT, "Approve 10 tokens first");

        // Transfer 10 tokens from the user to this contract
        bool success = erc20Token.transferFrom(msg.sender, address(this), PRICE_NFT);
        require(success, "Token transfer failed");

        // Mint 1 NFT to the user
        nftContract.mintNFT(msg.sender); 

        // Burn tokens received
        erc20Token.burn(address(this), PRICE_NFT);       

    }   


 
}