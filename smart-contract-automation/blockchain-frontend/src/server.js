const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors"); // Import the CORS package
const { Defender } = require("@openzeppelin/defender-sdk");

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all origins (you can specify specific origins if needed)
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// API endpoint to trigger relayer logic
app.post("/run-relayer", async (req, res) => {
  try {
    const client = new Defender({
      relayerApiKey: process.env.DEFENDER_RELAYER_KEY,
      relayerApiSecret: process.env.DEFENDER_RELAYER_SECRET,
    });

    // Get relayer information
    const info = await client.relaySigner.getRelayer();
    console.log("Relayer Info:", JSON.stringify(info, null, 2));

    // Send test transaction via relay
    const tx = await client.relaySigner.sendTransaction({
      to: "0x1B9ec5Cc45977927fe6707f2A02F51e1415f2052",
      speed: "fast",
      data: "0x6057361d000000000000000000000000000000000000000000000000000000000000000a",
      gasLimit: "80000",
    });
    console.log("Transaction sent! Hash:", tx.hash);

    // Get transaction status
    const txUpdate = await client.relaySigner.getTransaction(tx.transactionId);
    console.log("Tx Status", JSON.stringify(txUpdate, null, 2));

    // Send a response with the transaction status
    res.json({
      message: "Transaction sent!",
      txHash: tx.hash,
      status: txUpdate,
    });
  } catch (error) {
    console.error("Error in relayer:", error);
    res.status(500).json({ error: "Failed to execute relayer logic." });
  }
});

// API endpoint to trigger monitor logic
app.post("/run-monitor", async (req, res) => {
  try {
    // Ensure environment variables are defined
    const apiKey = process.env.DEFENDER_MONITOR_KEY;
    const apiSecret = process.env.DEFENDER_MONITOR_SECRET;

    console.log(
      "API Key:",
      process.env.DEFENDER_MONITOR_KEY ? "Exists" : "Missing"
    );
    console.log(
      "API Secret:",
      process.env.DEFENDER_MONITOR_SECRET ? "Exists" : "Missing"
    );

    if (!apiKey || !apiSecret) {
      throw new Error("Defender API credentials are missing");
    }

    const creds = {
      apiKey: process.env.DEFENDER_MONITOR_KEY,
      apiSecret: process.env.DEFENDER_MONITOR_SECRET,
    };

    const client = new Defender(creds);

    const getList = await client.monitor.list();

    //Monitor ID: 48e8b373-d102-46a3-af20-12654ef677f2
    const monitorId = "48e8b373-d102-46a3-af20-12654ef677f2";

    const result = await client.monitor.get(monitorId);

    const network = result.network;
    const monitorName = result.name;
    console.log("Monitor ID:" + monitorId);
    console.log("Network: " + network);
    console.log("Monitor Name: " + monitorName);

    // Send a response with the transaction status
    res.json({
      message: "Monitor called",
      monitorName: monitorName,
      network: network,
    });
  } catch (error) {
    console.error("Error in monitor:", error);
    res.status(500).json({ error: "Failed to execute monitor logic." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
