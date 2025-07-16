const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");

// We need to upgrade the contract with the Openzeppelin upgradability plugin

// 2 FUNCTIONS:
// mainOriginal deploys the original contracts (without upgrades): MintNFTERC20.sol
// mainUpgrade deploys the upgraded contracts: MintNFTERC20Upgrade.sol

async function mainOriginal() {
  const [deployer, user1, user2] = await ethers.getSigners();

  // 1: DEPLOY ORIGINAL ERC20 CONTRACT
  console.log("Deploying MyERCToken to Hardhat Testnet...");

  const myERCToken = await hre.ethers.getContractFactory("MyERCToken");

  console.log("Deploying the contract...");

  // Constructor has 2 arguments: initial supply and address of authority (here: deployer)
  const contractERC20 = await myERCToken.deploy(100, deployer.address);
  await contractERC20.deployed();

  console.log("MyERCToken deployed to:", contractERC20.address);

  // Test if we can mint the token
  const mintERC = await contractERC20
    .connect(deployer)
    .mint(deployer.address, 10);

  const balanceERC = await contractERC20.balanceOf(deployer.address);
  console.log("Balance ERC20:" + balanceERC);

  // 2: DEPLOY ORIGINAL NFT CONTRACT
  console.log("Deploying MyNFT to Hardhat Testnet...");

  const myNFT = await hre.ethers.getContractFactory("MyNFT");

  console.log("Deploying the contract...");

  // Constructor has 1 arugment: address of authority (here: deployer)
  const contractNFT = await myNFT.deploy(deployer.address);
  await contractNFT.deployed();

  console.log("MyNFT deployed to:", contractNFT.address);

  // Test if we can mint the token
  const mintNFT = await contractNFT.connect(deployer).mintNFT(deployer.address);

  const ownerNFT = await contractNFT.ownerOf(0);
  console.log("Owner NFT:" + ownerNFT);

  // 3: DEPLOY ORIGINAL AUTHORITY CONTRACT
  console.log("Deploying AuthorityContract to Hardhat Testnet...");

  const authorityContract = await hre.ethers.getContractFactory(
    "AuthorityContract"
  );

  console.log("Deploying the contract...");

  // Constructor has 1 argument: initial supply
  const contractAuth = await authorityContract.deploy(100);
  await contractAuth.deployed();

  console.log("AuthorityContract deployed to:", contractAuth.address);
}

// mainOriginal()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

// This is the function main for the upgradeable contracts
async function mainUpgrade() {
  const [deployer, user1, user2] = await ethers.getSigners();

  const myERCTokenUpgrade = await hre.ethers.getContractFactory(
    "MyERCTokenUpgrade"
  );

  // Deploy proxy contract: 3 arguments
  // 1: Contract name,
  // 2: arguments from original constructor (now initialize function)
  // and 3: name of initializer function
  const contractERC20Upgrade = await upgrades.deployProxy(
    myERCTokenUpgrade,
    [100, deployer.address],
    { initializer: "initialize" }
  );
  await contractERC20Upgrade.deployed();
  console.log(
    "Upgraded ERC20 contract deployed at:",
    contractERC20Upgrade.address
  );

  // 2: DEPLOY ORIGINAL NFT CONTRACT
  console.log("Deploying upgraded MyNFTUpgrade to Hardhat Testnet...");

  const myNFTUpgrade = await hre.ethers.getContractFactory("MyNFTUpgrade");

  console.log("Deploying the contract...");

  // Constructor has 1 arugment: address of authority (here: deployer)
  const contractNFTUpgrade = await upgrades.deployProxy(
    myNFTUpgrade,
    [deployer.address],
    { initializer: "initialize" }
  );
  await contractNFTUpgrade.deployed();

  console.log("MyNFTUpgrade deployed to:", contractNFTUpgrade.address);

  //   // Test if we can mint the token
  //   const mintNFT = await contractNFT.connect(deployer).mintNFT(deployer.address);

  //   const ownerNFT = await contractNFT.ownerOf(0);
  //   console.log("Owner NFT:" + ownerNFT);

  // 3: DEPLOY ORIGINAL AUTHORITY CONTRACT
  console.log("Deploying AuthorityContract to Hardhat Testnet...");

  const authorityContractUpgrade = await hre.ethers.getContractFactory(
    "AuthorityContractUpgrade"
  );

  console.log("Deploying the contract...");

  // Deploy proxy contract: initialize with contract addresses from above
  const contractAuthority = await upgrades.deployProxy(
    authorityContractUpgrade,
    [contractERC20Upgrade.address, contractNFTUpgrade.address],
    {
      initializer: "initialize",
      gasLimit: 6000000, // Error: code is too large?? Adjust as needed
    }
  );

  await contractAuthority.deployed();

  console.log(
    "Upgraded authorityContract deployed to:",
    contractAuthority.address
  );
}

mainUpgrade()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
