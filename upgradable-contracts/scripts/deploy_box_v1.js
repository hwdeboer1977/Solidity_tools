// scripts/deploy_upgradeable_box.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  // Check my balance address
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  const balance = await deployer.getBalance();
  console.log("Balance:", ethers.utils.formatEther(balance));

  // Deploy contract
  //   const Box = await ethers.getContractFactory("Box");
  //   console.log("Deploying Box...");
  //   const box = await upgrades.deployProxy(Box, [42], {
  //     initializer: "initialize",
  //   });
  //   await box.deployed();
  //   console.log("Box deployed to:", box.address);

  // Now check our address on etherscan and you see:
  // 3 contracts were created:
  // 1. TransparentUpgradeableProxy: 0x8730aA773b868Ff49e9545b2e3365A3331a1a6aC
  // 2. ProxyAdmin: 0x378bc398438B61c6ac3BA9e5FB03AB7EE7D1A211
  // 3. Our Box contract (not verified), or implementation contract: 0x5E2780833295bb2Ba935B2A7415c238102F859Ed

  // First verify our contract: npx hardhat verify --network sepolia 0xYourContractAddress

  // Now check the results (and comment out deployment code above)

  //   const value = await box.val();
  //   console.log(value);
}

main();
