// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";

// How to run?
// 1. deploy contract with Merkle root as input
// 2. mint NFT by providing Merkle proof


contract MerkleTreeBit is ERC721, Ownable(msg.sender) {

    bytes32 public merkleRoot; // Merkle Root hash
    


    // 2nd: Bitmap
    using BitMaps for BitMaps.BitMap; // Bitmaps from OpenZeppeling
    BitMaps.BitMap private bitmap; // Bitmap declaration

    // 2nd: Bitmap
    function _getBitIndex(address user) internal pure returns (uint256) {
        // Generate a unique bit index for the address
        return uint256(keccak256(abi.encodePacked(user)));
    }

    function hasMintedBitMap(address user) public view returns (bool) {
        uint256 index = _getBitIndex(user);
        return bitmap.get(index);
    }


    uint256 public nextTokenId = 1; // TokenID

    // Constructor takes the Merkle Root as input
    // Merkle root = ff7a107c65f343196c83d59065c5e314d66b7e6a90b2ec5b0a9e8a669818fece
    constructor(bytes32 _merkleRoot) ERC721("Merkle NFT", "MFT") {
        merkleRoot = _merkleRoot;
    }


    // Internal function for bitmap-based minting
    function mintBitMap(bytes32[] calldata _merkleProof) external {
        uint256 index = _getBitIndex(msg.sender);
        require(!bitmap.get(index), "Address has already minted");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Invalid proof");

        bitmap.set(index);

        _safeMint(msg.sender, nextTokenId);
        nextTokenId++;
    }

    // Function to update the Merkle Root (only callable by the owner)
    function updateMerkleRoot(bytes32 _newMerkleRoot) external onlyOwner {
        merkleRoot = _newMerkleRoot;
    }
}

// Proof:
// Belongs to address 0xdD870fA1b7C4700F2BD7f44238821C26f7392148"
// ["0x702d0f86c1baf15ac2b8aae489113b59d27419b751fbf7da0ef0bae4688abc7a","0xb159efe4c3ee94e91cc5740b9dbb26fc5ef48a14b53ad84d591d0eb3d65891ab"]
