import { ethers } from "ethers";
import express from "express";
import cors from "cors"; // Import cors

// Cors fixes the error:
// Access to fetch at 'http://localhost:4000/events' from origin 'http://localhost:3000' has been blocked by CORS policy

const urlMyApi =
  //"https://polygon-mainnet.g.alchemy.com/v2/ZvyuEwQ0lLVMwUbfqrbsbh6g4cITHA6G";
  "https://eth-mainnet.g.alchemy.com/v2/ZvyuEwQ0lLVMwUbfqrbsbh6g4cITHA6G";
// USDT token address on Polygon Mainnet
//const tokenAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT Polygon
const tokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT Ethereum

// Connect to the Polygon network with Alchemy)
const provider = new ethers.providers.JsonRpcProvider(urlMyApi);

// Express is a popular and lightweight Node.js framework specifically designed
// for building backend applications, such as APIs and web servers.
// It provides a straightforward way to handle HTTP request
const app = express();
app.use(cors()); // Enables CORS for all origins
const PORT = 4000;

// In-memory array to store transfer events
let events = [];

// Store volume data per block
// Each item in blockVolumes will look like { blockNumber: <blockNumber>, volume: <totalVolume> }.
let blockVolumes = [];

// Array to store the latest 10 blocks' BASEFEE data
let baseFees = [];

// Array to store the latest 10 blocks' fee ratio data
let gasRatios = [];

// Define the Transfer event signature hash
const transferEventSignature = ethers.utils.id(
  "Transfer(address,address,uint256)"
);
console.log("Transfer Event Signature:", transferEventSignature);

// 2 options: (1) Listen to Transfer events or (2) Listen to Transfer function calls
// Option 1: Listen to Transfer events (file backend_v1 uses option 2: Listen to Transfer function calls)
// Define the Transfer event signature hash
// It is the Keccak-256 hash of the event signature for the Transfer event, which is:
// Transfer(address,address,uint256)
// It equals: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef

// Add this to your provider.on() function where events are being tracked
provider.on(
  {
    address: tokenAddress,
    topics: [transferEventSignature],
  },
  (log) => {
    try {
      const value = ethers.utils.defaultAbiCoder.decode(
        ["uint256"],
        log.data
      )[0];
      const usdtAmount = ethers.utils.formatUnits(value, 6);
      const blockNumber = log.blockNumber;

      // Find or create a record for the block's volume

      // This line checks if the blockVolumes array already has an entry for the current blockNumber
      let blockVolume = blockVolumes.find((b) => b.blockNumber === blockNumber);
      // If not, it creates a new object { blockNumber, volume: 0 } and pushes it to blockVolumes.
      if (!blockVolume) {
        blockVolume = { blockNumber, volume: 0 };
        blockVolumes.push(blockVolume);
      }

      // Accumulate volume for this block
      blockVolume.volume += Math.round(parseFloat(usdtAmount));

      // Keep only the latest 10 blocks
      blockVolumes = blockVolumes.slice(-10);
      //console.log("Block volume updated:", blockVolumes);
    } catch (error) {
      console.error("Error decoding Transfer event:", error);
    }
  }
);

// Listen to Transfer events in real-time// Listen to Transfer events in real-time
// The provider.on() function continuously listens for new blocks and events in real-time
provider.on(
  {
    address: tokenAddress, // Filter by the specific token address
    topics: [transferEventSignature], // Filter transfer event,
  },
  (log) => {
    try {
      // Decode the indexed parameters from topics
      const from = ethers.utils.defaultAbiCoder.decode(
        ["address"],
        log.topics[1]
      )[0];
      const to = ethers.utils.defaultAbiCoder.decode(
        ["address"],
        log.topics[2]
      )[0];

      // Decode the non-indexed parameter (value) from log.data
      const value = ethers.utils.defaultAbiCoder.decode(
        ["uint256"],
        log.data
      )[0];

      const usdtAmount = ethers.utils.formatUnits(value, 6); // USDT uses 6 decimals
      const roundedUsdtAmount = parseFloat(usdtAmount).toFixed(0); // Round to 0 decimals
      // Create event object
      const event = {
        blockNumber: log.blockNumber,
        from,
        to,
        value: roundedUsdtAmount,
        timestamp: new Date().toISOString(), // Add timestamp for tracking
      };

      // Add the new event to the start of the events array and keep only the latest 10 events
      events = [event, ...events].slice(0, 10);

      // Log the event for debugging purposes
      //console.log("New USDT Transfer event detected:", event);
    } catch (error) {
      console.error("Error decoding Transfer event:", error);
    }
  }
);

// Update provider to listen to new blocks and capture BASEFEE
provider.on("block", async (blockNumber) => {
  try {
    const block = await provider.getBlock(blockNumber);

    // Capture the BASEFEE for the block
    const baseFee = block.baseFeePerGas
      ? ethers.utils.formatUnits(block.baseFeePerGas, "gwei")
      : null;

    // Capture gasUsed and gasLimit (in units of gas)
    const gasUsed = block.gasUsed.toNumber();
    const gasLimit = block.gasLimit.toNumber();
    const gasRatio = (gasUsed / gasLimit).toFixed(2);

    // Add block number and baseFee to baseFees array if baseFee is available
    if (baseFee) {
      // Array with baseFee
      baseFees.push({ blockNumber, baseFee: parseFloat(baseFee).toFixed(2) });
      baseFees = baseFees.slice(-10); // Keep only the latest 10 entries
      console.log("BASEFEE data updated:", baseFees);

      // Array with ratio gasUsed and gasLimit
      gasRatios.push({ blockNumber, gasRatio: parseFloat(gasRatio) });
      console.log("gasRatio updated:", gasRatios);
    }
  } catch (error) {
    console.error("Error fetching BASEFEE:", error);
  }
});

// Combined endpoint to retrieve both baseFees and gasRatios
app.get("/block-metrics", (req, res) => {
  res.json({ baseFees, gasRatios });
});
// Endpoint to retrieve events with USDT transactions
app.get("/events", (req, res) => {
  res.json(events);
});

// Endpoint to retrieve block volumes
app.get("/block-volumes", (req, res) => {
  res.json(blockVolumes);
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/events`);
});
