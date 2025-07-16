const { ethers, upgrades } = require("hardhat");

// We need to upgrade the Staking contract with the Openzeppelin upgradability plugin
// Staking contract has 3 contracts: MyERC20, MyNFT, StakingContract

// 2 FUNCTIONS:
// mainOriginal deploys the original contracts (without upgrades): MintNFTERC20.sol
// mainUpgrade deploys the upgraded contracts: MintNFTERC20Upgrade.sol

// Function mainOriginal() deploys staking contract without upgrade
async function mainOriginal() {
  const [deployer, user1, user2] = await ethers.getSigners();

  // 1: DEPLOY ORIGINAL STAKING CONTRACT
  console.log("Deploying StakingContract to Hardhat Testnet...");

  // Deploy the StakingContract
  // const StakingContract = await ethers.getContractFactory("StakingContract");
  // Multiple artifacts error message, use instead:
  const StakingContract = await ethers.getContractFactory(
    "contracts/stakeNFT.sol:StakingContract"
  );

  console.log("Deploying StakingContract...");
  const stakingContract = await StakingContract.deploy(
    ethers.utils.parseEther("1000000")
  ); // Initial supply for MyERC20

  await stakingContract.deployed();

  console.log("StakingContract deployed to:", stakingContract.address);

  // Retrieve the deployed MyERC20 and MyNFT contract addresses
  const erc20TokenAddress = await stakingContract.erc20Token();
  const nftContractAddress = await stakingContract.nftContract();

  console.log("MyERC20 deployed to:", erc20TokenAddress);
  console.log("MyNFT deployed to:", nftContractAddress);

  console.log("Deployment complete!");
}

// Function mainUpgrade() deploys staking contract with upgrade
async function mainUpgrade() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // My code is too long: If your contract's bytecode is 28,044 bytes, it exceeds
  // the Ethereum 24 KB limit (24,576 bytes) for contract deployment. You'll need to optimize or modularize the contract to reduce its size.
  // Approach: Avoid deploying MyERC20 and MyNFT from the StakingContract. Instead,
  //deploy them separately and pass their addresses to the StakingContract's initialize function.
  // This significantly reduces the size of the StakingContract.

  // Get the deployed bytecode length
  //   const bytecode = StakingContract.bytecode;
  //   const bytecodeLength = bytecode.length / 2 - 1; // Each byte is represented by 2 hex characters

  //   console.log(`StakingContract bytecode length: ${bytecodeLength} bytes`);

  // Step 1: Deploy MyERC20
  const MyERC20 = await ethers.getContractFactory(
    "contracts/stakeNFTUpgrade.sol:MyERC20"
  );

  console.log("Deploying ERC20 contract with proxy...");

  // Deploy proxy contract: initialize with the initial supply of MyERC20
  const contractERC20 = await upgrades.deployProxy(
    MyERC20,
    [ethers.utils.parseEther("1000"), deployer.address],
    {
      initializer: "initialize",
      gasLimit: 6000000, // Error: code is too large?? Adjust as needed
    }
  );

  await contractERC20.deployed();

  console.log("ERC20 contract deployed to:", contractERC20.address);

  // Step 2: Deploy MyNFT
  const MyNFT = await ethers.getContractFactory(
    "contracts/stakeNFTUpgrade.sol:MyNFT"
  );

  console.log("Deploying MyNFT contract with proxy...");

  // Deploy proxy contract: initialize with the initial supply of MyERC20
  const contractNFT = await upgrades.deployProxy(MyNFT, [deployer.address], {
    initializer: "initialize",
    gasLimit: 6000000, // Error: code is too large?? Adjust as needed
  });

  await contractNFT.deployed();

  console.log("NFT contract deployed to:", contractNFT.address);

  // Step 3: Deploy the stakingContract (with ERC20 and NFT as input)
  const StakingContract = await ethers.getContractFactory(
    "contracts/stakeNFTUpgrade.sol:StakingContract"
  );

  console.log("Deploying StakingContract contract with proxy...");

  // Deploy proxy contract: initialize with the initial supply of MyERC20
  const contractStaking = await upgrades.deployProxy(
    StakingContract,
    [contractERC20.address, contractNFT.address],
    {
      initializer: "initialize",
      gasLimit: 6000000, // Error: code is too large?? Adjust as needed
    }
  );

  await contractStaking.deployed();

  console.log("Staking contract deployed to:", contractStaking.address);
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
