// scripts/deployMockWbtc.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying MockWBTC with deployer:", deployer.address);

  const MockWBTC = await ethers.getContractFactory("MockWBTC");

  // Try common constructor shapes:
  // (name, symbol, decimals)  OR  (name, symbol) with decimals overridden in the contract
  let wbtc;
  try {
    wbtc = await MockWBTC.deploy();
  } catch (e) {
    console.log(
      "MockWBTC constructor with (name,symbol,decimals) failed. Trying (name,symbol)..."
    );
    wbtc = await MockWBTC.deploy("Wrapped Bitcoin", "WBTC");
  }

  await wbtc.waitForDeployment();
  const wbtcAddress = await wbtc.getAddress();
  console.log(`✅ MockWBTC deployed at: ${wbtcAddress}`);

  // If the mock has a mint function, mint 10 WBTC to the deployer for testing (8 decimals).
  try {
    // ethers v6: parseUnits returns a bigint
    const amount = ethers.parseUnits("10", 8);
    // Probe for mint function
    wbtc.interface.getFunction("mint");
    const tx = await wbtc.mint(deployer.address, amount);
    await tx.wait();
    console.log(`🪙 Minted 10 WBTC to ${deployer.address}`);
  } catch {
    console.log("ℹ️ No mint() function found on MockWBTC, skipping test mint.");
  }

  // Save deployment info (so other scripts can read the WBTC address)
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Merge with existing file if present
  const filePath = path.join(deploymentsDir, `${hre.network.name}.json`);
  let existing = {};
  if (fs.existsSync(filePath)) {
    existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  const data = {
    ...existing,
    MockWBTC: {
      address: wbtcAddress,
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
    },
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(
    `📂 Deployment info saved to deployments/${hre.network.name}.json`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ MockWBTC deployment failed:", err);
    process.exit(1);
  });
