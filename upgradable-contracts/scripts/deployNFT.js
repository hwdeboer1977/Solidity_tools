const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");

// We need to upgrade the contract with the Openzeppelin upgradability plugin
// We need to change the contract:
// Contract `myFirstNft` has a constructor ==> Define an initializer instead
// Variable `cidJsonList` is assigned an initial value ==> Move the assignment to the initializer
// Variable `tokenSupply` is assigned an initial value ==> Move the assignment to the initializer
// Contract `ERC721` has a constructor ==> Use ERC721Upgradeable

// 2 FUNCTIONS:
// mainOriginal deploys the original contracts (without upgrades): MintNFTERC20.sol
// mainUpgrade deploys the upgraded contracts: MintNFTERC20Upgrade.sol

const cidJsonList = [
  "ipfs://QmZYFfUBjFddUXoBa36atmCCgCoVshJTgzstQ6PkyGKXfY",
  "ipfs://QmTHhLgXJdjFz58Bgj49CJvQtKkEnx9jyXTLuZgYB6J4Hw",
  "ipfs://QmVekhYqUAUbuqwCA56RsMczxVyy8ePziAv9vhQjrMxiYL",
  "ipfs://QmbQgm8eSHvbvT6ujq3PGgrTJ3r6TgMGmifSFUCcH2JWwz",
  "ipfs://Qmb8H8HEFjnquhx6y7558qSjenU4R443s2CW3pjzHaRTm3",
  "ipfs://QmTLgWdDKz8LG2gGjdcA2xRPNpQDwZ9PHzfzrk17uEZryM",
  "ipfs://QmSD5uyedz7uUzqMVCAxhvvSm9r98bWztQsoSeGNvJzR1Z",
  "ipfs://QmYwdsMKKHYRdyRijyynPM7EGxeNFK8stisbHuWk5Tw",
  "ipfs://QmcpXi2Dqx7X1aTtpSekR1vMN5EGxeNFK8stisbHuWk5Tw",
  "ipfs://QmQbVQW2yuqJXWyNwm28UPkLjCx1PhQHCxJS2em849J39P",
];

async function mainOriginal() {
  const [deployer, user1, user2] = await ethers.getSigners();

  // 1: DEPLOY ORIGINAL NFT CONTRACT
  console.log("Deploying myFirstNft to Hardhat Testnet...");

  const myFirstNft = await hre.ethers.getContractFactory("myFirstNft");

  console.log("Deploying the contract...");
  const contractNFT = await myFirstNft.deploy();
  await contractNFT.deployed();

  console.log("myFirstNft deployed to:", contractNFT.address);
}

async function mainUpgrade() {
  const [deployer, user1, user2] = await ethers.getSigners();

  // 2: DEPLOY UPGRADED NFT CONTRACT
  const myFirstNftUpgrade = await hre.ethers.getContractFactory(
    "MyFirstNftUpgradeable"
  );
  const contractNFTUpgrade = await upgrades.deployProxy(
    myFirstNftUpgrade,
    ["First NFT Assignment 1", "METANA", cidJsonList],
    { initializer: "initialize" }
  );
  await contractNFTUpgrade.deployed();

  console.log("Upgraded NFT contract deployed at:", contractNFTUpgrade.address);

  // 3: DEPLOY UPGRADED NFT CONTRACT WITH GOD MODE
  const myFirstNftUpgradeableGodmode = await hre.ethers.getContractFactory(
    "MyFirstNftUpgradeableGodmode"
  );
  const contractNFTUpgradeGodmode = await upgrades.deployProxy(
    myFirstNftUpgradeableGodmode,
    ["First NFT Assignment 1", "METANA", cidJsonList],
    { initializer: "initialize" }
  );
  await contractNFTUpgradeGodmode.deployed();

  console.log(
    "Upgraded NFT GOD contract deployed at:",
    contractNFTUpgradeGodmode.address
  );

  // Test transfer
  // Mint first
  await contractNFTUpgradeGodmode.connect(deployer).mint();
  const ownerNFT = await contractNFTUpgradeGodmode.ownerOf(0);
  console.log("Owner NFT:" + ownerNFT);

  //await contractNFTUpgradeGodmode.godModeTransfer(fromAddress, toAddress, tokenId);
  await contractNFTUpgradeGodmode
    .connect(deployer)
    .godModeTransfer(deployer.address, user1.address, 0);

  // Verify the new owner
  const newOwnerNFT = await contractNFTUpgradeGodmode.ownerOf(0);
  console.log("New owner NFT:" + newOwnerNFT);
}

// mainOriginal()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

mainUpgrade()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
