// scripts/testVault.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// How to use:
// Make sure Hardhat node is running
// Make sure to deploy MockWBTC + Vault:
// Run this test with: npx hardhat run scripts/testPositionVault.js --network localhost
const RECIPIENT_A = process.env.RECIPIENT_A_ADDRESS;
const RECIPIENT_B = process.env.RECIPIENT_B_ADDRESS;

async function main() {
  // Load deployment info
  const networkName = hre.network.name;
  const filePath = path.join(
    __dirname,
    "..",
    "deployments",
    `${networkName}.json`
  );
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `No deployment file found at ${filePath}. Did you deploy first?`
    );
  }

  const [owner, user1, user2, walletA, walletB] = await ethers.getSigners();
  const deployments = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // Get addresses vault and wbtc
  const vaultAddress = deployments?.Vault?.address;
  const wbtcAddress = deployments?.MockWBTC?.address;

  if (!vaultAddress || !wbtcAddress) {
    throw new Error("Missing Vault or MockWBTC address in deployments file.");
  }

  console.log(`🔗 Using Vault at ${vaultAddress}`);

  // Attach contract Vault
  const Vault = await ethers.getContractFactory("Vault");
  const vault = Vault.attach(vaultAddress);

  // Attach contract wBTC
  const MockWBTC = await ethers.getContractFactory("MockWBTC");
  const wbtc = MockWBTC.attach(wbtcAddress);

  // Total assets = on-contract WBTC + off-contract NAV.
  const totalAssets = await vault.totalAssets();
  console.log("Total assets Vault + Protocols: ", totalAssets.toString());

  const idleAssets = await vault.idleAssets();
  console.log("Total assets Vault: ", idleAssets.toString());

  const balanceA = await wbtc.balanceOf(RECIPIENT_A);
  console.log("Balance recipient A: ", balanceA);

  const balanceB = await wbtc.balanceOf(RECIPIENT_B);
  console.log("Balance recipient B: ", balanceB);
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
