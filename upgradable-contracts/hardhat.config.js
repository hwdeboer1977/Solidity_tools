require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.10",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200, // Adjust based on your contract's usage pattern
    },
  },
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/eoDKFwWxqATc20dM_7bj2ZOuUD8bsHtk", // Replace with your Infura or Alchemy URL
      accounts: [
        "89e4e04ecc424d1ae6b38028b631ca45d84da36d6b444441c5345ac372f1e27b",
      ], // Replace with the private key of your Sepolia account
    },
  },
  etherscan: {
    apiKey: "XF5X4I75898Q94MK8T7X7F2A5SVYSA7C7Q", // Optional, for verifying contracts on Etherscan
  },
};
