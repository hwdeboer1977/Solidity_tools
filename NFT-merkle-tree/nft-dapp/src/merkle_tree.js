const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { Buffer } = require("buffer");

// Example whitelist addresses
const whitelistAddresses = [
  "0x5B38DA6A701C568545DCFCB03FCB875F56BEDDC4",
  "0x5A641E5FB72A2FD9137312E7694D42996D689D99",
  "0xDCAB482177A592E424D1C8318A464FC922E8DE40",
  "0x6E21D37E07A6F7E53C7ACE372CEC63D4AE4B6BD0",
  "0x09BAAB19FC77C19898140DADD30C4685C597620B",
  "0xCC4C29997177253376528C05D3DF91CF2D69061A",
  "0xdD870fA1b7C4700F2BD7f44238821C26f7392148",
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  "0xcFeC77053D83C77c50284d258F2ED25dA338bb36",
  "0xBBe2ded2c9E0C8B6f0D36ab8e533509f98Ce05aF",
];

// Function to create the Merkle tree and return the hexProof for a given address
function createMerkleTree(address) {
  // Normalize addresses to lowercase and hash them
  const leafNodes = whitelistAddresses.map((addr) =>
    keccak256(addr.toLowerCase())
  );

  // Create the Merkle Tree
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

  // Get the root hash
  const rootHash = merkleTree.getRoot().toString("hex");
  console.log("Whitelist Merkle Tree\n", merkleTree.toString());
  console.log("Root Hash:", `0x${rootHash}`);

  // Example claiming address (index 9 in this case)
  // const claimingAddress = keccak256(
  //   "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".toLowerCase()
  // );

  // Normalize and hash the input address
  const leaf = keccak256(address.toLowerCase());
  const hexProof = merkleTree.getHexProof(leaf);

  // Verify if the claiming address is part of the Merkle Tree
  const isVerified = merkleTree.verify(
    hexProof,
    leaf,
    Buffer.from(rootHash, "hex")
  );
  // Generate the hex proof for the claiming address
  // const hexProof = merkleTree.getHexProof(claimingAddress);
  console.log("Hex Proof:", hexProof);

  console.log("Verification Status:", isVerified);

  return {
    hexProof,
    rootHash: `0x${rootHash}`,
    verified: isVerified,
  };
}

module.exports = { createMerkleTree };
