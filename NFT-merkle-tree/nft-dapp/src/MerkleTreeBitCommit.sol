// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";

// How to run?
// 1. deploy contract with Merkle root as input
// 2. mint NFT by providing Merkle proof


contract MerkleTreeBitCommit is ERC721, Ownable(msg.sender) {

    bytes32 public merkleRoot; // Merkle Root hash

    using BitMaps for BitMaps.BitMap; // Bitmaps from OpenZeppeling
    BitMaps.BitMap private bitmap; // Bitmap declaration

    uint256 public nextTokenId = 1; // TokenID
    
    uint256 public maxSupply = 10000; // Example max supply for NFTs

    uint256 public constant REVEAL_DELAY = 10; // Blocks to wait for reveal

    mapping(uint256 => bool) private mintedTokens;
    
    // Struct voor commitment info
    struct Commitment {
        bytes32 commitmentHash; // The user's commitment hash
        uint256 blockNumber;    // Block number when the commitment was made
        bool revealed;          // Whether the user has already revealed
    }

    // Implement a state machine for managing the minting stages of your NFT contract 
    // Enum with 4 stages:
    // 1. Inactive: No minting allowed.
    // 2. Presale: Whitelisted addresses (Merkle Proof required) can mint.
    // 3. PublicSale: Anyone can mint without restrictions.
    // 4. SoldOut: Minting is disabled due to reaching the max supply.
    enum SaleState { Inactive, Presale, PublicSale, SoldOut }
    SaleState public currentState;
    event StateChanged(SaleState newState);

    mapping(address => Commitment) public commitments;

    event Commit(address indexed user, bytes32 commitmentHash, uint256 blockNumber);
    event Reveal(address indexed user, uint256 tokenId);
    event Mint(address indexed user, uint256 tokenId);

    // Constructor takes the Merkle Root as input
    // Merkle root = ff7a107c65f343196c83d59065c5e314d66b7e6a90b2ec5b0a9e8a669818fece
    constructor(bytes32 _merkleRoot) ERC721("Merkle NFT", "MFT") {
        merkleRoot = _merkleRoot;
        // Contract deployed but status is inactive (default)
        currentState = SaleState.Inactive; 
    }

    // Modifier that handles correct stages for the functions
    modifier onlyInState(SaleState state) {
        require(currentState == state, "Invalid state for this action");
        _;
    }

    // Admin function to change the current state: only the owener can move states
    function setState(SaleState newState) external onlyOwner {
        currentState = newState;
        emit StateChanged(newState);
    }

    //////////////////////// MERKLE TREE MINTING WITH BITMAP ///////////////////////////
    // Bitmap functions
    function _getBitIndex(address user) internal pure returns (uint256) {
        // Generate a unique bit index for the address
        return uint256(keccak256(abi.encodePacked(user)));
    }

    function hasMintedBitMap(address user) public view returns (bool) {
        uint256 index = _getBitIndex(user);
        return bitmap.get(index);
    }

    function mintBitMap(bytes32[] calldata _merkleProof) external  onlyInState(SaleState.Presale) {
        uint256 index = _getBitIndex(msg.sender);
        require(!bitmap.get(index), "Address has already minted");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Invalid proof");

        bitmap.set(index);

        _safeMint(msg.sender, nextTokenId);
        emit Mint(msg.sender, nextTokenId);
        nextTokenId++;

        // If max supply is reached: set stage to Soldout
        if (nextTokenId > maxSupply) {
            currentState = SaleState.SoldOut;
            emit StateChanged(SaleState.SoldOut);
        }
    }

    // Public sale: anyone can mint (no Merkle tree proof etc neeced)
      function mintPublicSale() external onlyInState(SaleState.PublicSale) {
        uint256 index = _getBitIndex(msg.sender);
        require(!bitmap.get(index), "Address has already minted");
        require(nextTokenId <= maxSupply, "Max supply reached");

        bitmap.set(index);
        _safeMint(msg.sender, nextTokenId);
        emit Mint(msg.sender, nextTokenId);
        nextTokenId++;

        if (nextTokenId > maxSupply) {
            currentState = SaleState.SoldOut;
            emit StateChanged(SaleState.SoldOut);
        }
    }



    ////////////////////////// COMMIT-REVEAL LOGIC //////////////////////////////////////
    // Commit function
    function commit(bytes32 commitmentHash) external onlyInState(SaleState.PublicSale)  {
        require(commitments[msg.sender].blockNumber == 0, "Already committed!");
        commitments[msg.sender] = Commitment(commitmentHash, block.number, false);

        emit Commit(msg.sender, commitmentHash, block.number);
    }



    // Reveal function
    function reveal(string memory secret) external onlyInState(SaleState.PublicSale)  {
        Commitment storage userCommitment = commitments[msg.sender];

        // Ensure user has committed
        require(userCommitment.blockNumber != 0, "No commitment found!");
        require(!userCommitment.revealed, "Already revealed!");
        require(block.number >= userCommitment.blockNumber + REVEAL_DELAY, "Reveal too early!");

        // Recalculate the commitment hash
        // bytes32 calculatedHash = keccak256(abi.encodePacked(secret, msg.sender));
        // require(calculatedHash == userCommitment.commitmentHash, "Invalid secret!");

        bytes32 calculatedHash = keccak256(abi.encodePacked(secret, msg.sender));
        require(calculatedHash == userCommitment.commitmentHash, "Invalid secret!");


        // Generate random NFT ID
        uint256 randomId = uint256(
            keccak256(
                abi.encodePacked(secret, blockhash(userCommitment.blockNumber + REVEAL_DELAY), msg.sender)
            )
        ) % maxSupply;

        // Ensure NFT ID is not already allocated
        require(!mintedTokens[randomId], "NFT ID already minted!");

        // Assign NFT to the user
        emit Reveal(msg.sender, randomId);

        _safeMint(msg.sender, randomId);
        userCommitment.revealed = true;

        emit Reveal(msg.sender, randomId);

    }

    ////////////////////////////// MULTICALL FUNCTIONALITY //////////////////////////////
    // The purpose of the MultiCall contract is to allow a user to make multiple external calls to other contracts
    // (or the same contract) in a single transaction. 
    // It accepts arrays of addresses and data, and executes each call one by one.
    // 1st input: targets = array of contract addresses that will be called
    // 2nd input: data = array of bytes data that represents the encoded function calls for each target contract.
    function multiCall(address[] calldata targets, bytes[] calldata data)
        external
        payable
        returns (bytes[] memory results)
    {
        require(targets.length == data.length, "Mismatched input lengths");

        // This ensures that the targets array and data array have the same length. 
        // Each target contract must have corresponding data that represents the 
        // function call to be executed on that contract.
        results = new bytes[](targets.length);

        // The function then loops through the targets array. 
        // For each address in targets[i], it makes a staticcall using the encoded data data[i]
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, bytes memory result) = targets[i].call(data[i]);
            require(success, "Call failed");
            results[i] = result;
        }
    }

    // Example function to generate call data for NFT transfers
    // function getTransferData(address to, uint256 tokenId) external pure returns (bytes memory) {
    //     return abi.encodeWithSelector(this.safeTransferFrom.selector, msg.sender, to, tokenId);
    // }

    function getTransferData(address from, address to, uint256 tokenId) external pure returns (bytes memory) {
        return abi.encodeWithSelector(
            bytes4(keccak256("safeTransferFrom(address,address,uint256)")),
            from,
            to,
            tokenId
        );
    }

    
    // Function to update the Merkle Root (only callable by the owner)
    function updateMerkleRoot(bytes32 _newMerkleRoot) external onlyOwner {
        merkleRoot = _newMerkleRoot;
    }


    // --- HELPER FUNCTIONS ---
    function ownerOfToken(uint256 tokenId) external view returns (address) {
        return ownerOf(tokenId);
    }

    function totalSupply() external view returns (uint256) {
        return nextTokenId - 1;
    }

}

// Proof:
// Belongs to address 0xdD870fA1b7C4700F2BD7f44238821C26f7392148"
// ["0x702d0f86c1baf15ac2b8aae489113b59d27419b751fbf7da0ef0bae4688abc7a","0xb159efe4c3ee94e91cc5740b9dbb26fc5ef48a14b53ad84d591d0eb3d65891ab"]
