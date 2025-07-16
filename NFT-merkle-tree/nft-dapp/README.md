# Getting Started with the Create React App

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.

### The React app uses Merkle Tree whitelisting for NFTs:

- \src\merke_tree.js: creates Merkle tree off chain
- \src\MerkleTreeMap.sol: deployed minting contract that uses mapping to track addresses.
- \src\MerkleTreeBit.sol: deployed minting contract that use bitmaps to track addresses.
- \src\MerkleTreeBitCommit.sol: as above, but alles for commit/reveal for tokenIds randomness.
- \src\DistributeFunds.sol: withdraw funds using pull pattern.

### All Solidity functions can be called with the React Frontend app!
