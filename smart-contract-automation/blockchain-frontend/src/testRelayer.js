const { Defender } = require("@openzeppelin/defender-sdk");

const dotenv = require("dotenv");

dotenv.config();

async function main() {
  // Set up client with relayer from defender OpenZeppelin
  const client = new Defender({
    relayerApiKey: process.env.DEFENDER_RELAYER_KEY,
    relayerApiSecret: process.env.DEFENDER_RELAYER_SECRET,
  });

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

  const txUpdate = await client.relaySigner.getTransaction(tx.transactionId);
  console.log("Tx Status", JSON.stringify(txUpdate, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
