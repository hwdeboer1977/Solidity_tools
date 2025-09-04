const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// How to run:
// 1. Start your Hardhat local node: npx hardhat node
// 2. In a new terminal: Deploy MockWBTC.sol:  npx hardhat run scripts/deployMockWbtc.js --network localhost
// 3. Deploy to localhost: npx hardhat run scripts/deployVault.js --network localhost

function readWbtcAddressFromDeployments(networkName) {
  try {
    const p = path.join(__dirname, "..", "deployments", `${networkName}.json`);
    if (!fs.existsSync(p)) return null;
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    return json?.MockWBTC?.address || null;
  } catch {
    return null;
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying Vault.sol with deployer:", deployer.address);

  const networkName = hre.network.name;

  // 1) Prefer deployments file (created by deployMockWbtc.js)
  let WBTC_ADDRESS = readWbtcAddressFromDeployments(networkName);

  // 2) Allow override via env
  if (process.env.WBTC_ADDRESS) {
    WBTC_ADDRESS = process.env.WBTC_ADDRESS;
  }

  if (!WBTC_ADDRESS) {
    throw new Error(
      "No WBTC address found. Run `npx hardhat run scripts/deployMockWbtc.js --network localhost` first, or set WBTC_ADDRESS env."
    );
  }

  // Owner defaults to deployer (override with OWNER env if desired)
  const OWNER_ADDRESS = process.env.OWNER || deployer.address;

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(WBTC_ADDRESS, OWNER_ADDRESS);
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log(`✅ Vault deployed at: ${address}`);
  console.log(`   - WBTC: ${WBTC_ADDRESS}`);
  console.log(`   - Owner: ${OWNER_ADDRESS}`);

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Merge with existing file if present
  const filePath = path.join(deploymentsDir, `${networkName}.json`);
  let existing = {};
  if (fs.existsSync(filePath)) {
    existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  const data = {
    ...existing,
    Vault: {
      address,
      wbtc: WBTC_ADDRESS,
      owner: OWNER_ADDRESS,
      network: networkName,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
    },
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`📂 Deployment info saved to deployments/${networkName}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
