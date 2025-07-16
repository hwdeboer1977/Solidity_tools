// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// How to run this code
// We have 2 contracts and 2 solidity files: Authority.sol and MyNFT1155.sol 
// First we deploy the myNFT1155 contract and save the NFT contract address
// Next we deploy the AuthorityContract and use the NFT contract address as input in de constructor
// Next we use transferAuthority function (with address from AuthorityContract) to transfer the Authority to mint

import "./MyNFT1155.sol"; // Assuming this is the contract you're controlling
 
contract AuthorityContract {
    MyERC1155NFT private nftContract;
    address private owner;

    constructor(address _nftContractAddress) {
        nftContract = MyERC1155NFT(_nftContractAddress);
        owner = msg.sender; // The deployer of the contract is the owner
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    // Function to mint NFTs via this smart contract
    function mintNFT(address to, uint256 tokenId, uint256 amount) public onlyOwner {
        nftContract.mint(to, tokenId, amount, ""); // Call the mint function on your ERC1155 contract
    }

    // Function to burn NFTs via this smart contract
    function burnNFT(address from, uint256 tokenId, uint256 amount) public onlyOwner {
        nftContract.burn(from, tokenId, amount); // Call the burn function on your ERC1155 contract
    }

}
