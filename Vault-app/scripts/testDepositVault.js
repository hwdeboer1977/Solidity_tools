// scripts/testVault.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// How to use:
// Make sure Hardhat node is running
// Make sure to deploy MockWBTC + Vault:
// Run this test with: npx hardhat run scripts/testDepositVault.js --network localhost
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

  // ALWAYS SET RECIPIENTS (OTHERWISE REBALANCING WILL REVERT)
  const setRecipients = await vault.setRecipients(RECIPIENT_A, RECIPIENT_B);

  // Call a simple getter
  const min = await vault.depositMin();
  console.log("Vault.depositMin():", min.toString());

  // User 1 deposits 1 wBTC
  const DEC = 8;
  const W = (s) => ethers.parseUnits(s, DEC);
  const amountUser1 = W("1");
  const amountApprove = W("10");
  await wbtc.transfer(user1.address, amountApprove);
  await wbtc.connect(user1).approve(await vault.getAddress(), amountApprove);
  await vault.connect(user1).deposit(amountUser1, user1.address);

  console.log(await wbtc.balanceOf(vault.target));
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
