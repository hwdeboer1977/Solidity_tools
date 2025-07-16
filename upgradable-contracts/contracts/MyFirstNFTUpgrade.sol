// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// Import ERC721 from openzeppelin
import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; 


// We upgrade the contracts from MyFirstNFT.SOL
// Import upgradeable libraries from OpenZeppelin
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
 

// Download images files for NFTs and upload images to Pinata
// Include CIDs images in the JSON files (and set attributes)
// Deploy contract at polygon mainnet (lower gas fees)
// Deployed at Mainnet Polygon, at 0xc317568d4d33b11a0abb65e1c173926c95aa3c2d
// Contract is verified. Here anyone can use the explorer to mint NFTs for free!

 
contract MyFirstNftUpgradeable  is Initializable, ERC721Upgradeable {

    // Declare list JSON files with CID from Pinata 
// string[] public cidJsonList = [
//         "ipfs://QmZYFfUBjFddUXoBa36atmCCgCoVshJTgzstQ6PkyGKXfY",
//         "ipfs://QmTHhLgXJdjFz58Bgj49CJvQtKkEnx9jyXTLuZgYB6J4Hw",
//         "ipfs://QmVekhYqUAUbuqwCA56RsMczxVyy8ePziAv9vhQjrMxiYL",
//         "ipfs://QmbQgm8eSHvbvT6ujq3PGgrTJ3r6TgMGmifSFUCcH2JWwz",
//         "ipfs://Qmb8H8HEFjnquhx6y7558qSjenU4R443s2CW3pjzHaRTm3",
//         "ipfs://QmTLgWdDKz8LG2gGjdcA2xRPNpQDwZ9PHzfzrk17uEZryM",
//         "ipfs://QmSD5uyedz7uUzqMVCAxhvvSm9r98bWztQsoSeGNvJzR1Z",
//         "ipfs://QmYwdsMKKHYRdyRijyynPM7nCF2okxsZEHvF2j1wtxDve9",
//         "ipfs://QmcpXi2Dqx7X1aTtpSekR1vMN5EGxeNFK8stisbHuWk5Tw",
//         "ipfs://QmQbVQW2yuqJXWyNwm28UPkLjCx1PhQHCxJS2em849J39P"
//     ];

    // String array is now updated in intialize function below
    string[] public cidJsonList;
    
    // Mapping of the tokenURI for each tokenId
    mapping(uint256 => string) public _tokenURIs;
 
    // Initialize function replaces the constructor
    function initialize(string memory name, string memory symbol, string[] memory _cidJsonList) public initializer {
        __ERC721_init(name, symbol);
        cidJsonList = _cidJsonList;
        tokenSupply = 0;
    }


    uint256 public tokenSupply;
    uint256 public constant MAXIMUM_SUPPLY = 10; // Maximum of 10 NFTs

    // Internal function to set the tokenURI for a token (filling up the mapping)
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _tokenURIs[tokenId] = _tokenURI;
    }

    // My NFT did not show up at OpenSea because I forgot to override this function below!!
    // _exists is not found in the files anymore?
   function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
   //     //require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    // Mint function to allow users to mint an NFT
    // Ignoring onlyOwner so everyone can mint for free here!
    function mint() external {
         
        require(tokenSupply < MAXIMUM_SUPPLY, "Supply is Max ");
        _mint(msg.sender, tokenSupply);  // Mint the NFT to the caller

        // Pick correct link from the array with CIDs
        string memory uri = cidJsonList[tokenSupply];
        _setTokenURI(tokenSupply, uri); 

        tokenSupply++;  // Increment the token ID counter
    }


}

