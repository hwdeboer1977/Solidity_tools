// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import ERC721 from openzeppelin
import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; 


// Download images files for NFTs and upload images to Pinata
// Include CIDs images in the JSON files (and set attributes)
// Deploy contract at polygon mainnet (lower gas fees)
// Deployed at Mainnet Polygon, at 0xc317568d4d33b11a0abb65e1c173926c95aa3c2d
// Contract is verified. Here anyone can use the explorer to mint NFTs for free!

 
contract myFirstNft is ERC721 {

    // Declare list JSON files with CID from Pinata 
string[] public cidJsonList = [
        "ipfs://QmZYFfUBjFddUXoBa36atmCCgCoVshJTgzstQ6PkyGKXfY",
        "ipfs://QmTHhLgXJdjFz58Bgj49CJvQtKkEnx9jyXTLuZgYB6J4Hw",
        "ipfs://QmVekhYqUAUbuqwCA56RsMczxVyy8ePziAv9vhQjrMxiYL",
        "ipfs://QmbQgm8eSHvbvT6ujq3PGgrTJ3r6TgMGmifSFUCcH2JWwz",
        "ipfs://Qmb8H8HEFjnquhx6y7558qSjenU4R443s2CW3pjzHaRTm3",
        "ipfs://QmTLgWdDKz8LG2gGjdcA2xRPNpQDwZ9PHzfzrk17uEZryM",
        "ipfs://QmSD5uyedz7uUzqMVCAxhvvSm9r98bWztQsoSeGNvJzR1Z",
        "ipfs://QmYwdsMKKHYRdyRijyynPM7nCF2okxsZEHvF2j1wtxDve9",
        "ipfs://QmcpXi2Dqx7X1aTtpSekR1vMN5EGxeNFK8stisbHuWk5Tw",
        "ipfs://QmQbVQW2yuqJXWyNwm28UPkLjCx1PhQHCxJS2em849J39P"
    ];

    
    // Mapping of the tokenURI for each tokenId
    mapping(uint256 => string) public _tokenURIs;
 
    constructor() ERC721("First NFT assignment 1", "METANA") {}

    uint256 public tokenSupply = 0;
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

