import React, { useState, useEffect } from "react";
import "./Chainlink.css";
import { ethers } from "ethers";
import timeBasedABI from "./timeBasedABI.json";
import customLogicABI from "./customLogicABI.json";
import countEmitLogABI from "./countEmitLogABI.json";
import countWithLogABI from "./countWithLogABI.json";

function Chainlink() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastCounter, setLastCounter] = useState(null);
  const [totalMinted, setTotalMinted] = useState(null);
  const [maxMintable, setMaxMintable] = useState(null);
  const [mintingStopped, setMintingStopped] = useState(null);
  const [counterWithLog, setCounterWithLog] = useState(null);

  // Contract Address of TimeBased keeper
  //const contractAddTimeBased = "0xec416c24E6E63Ebdb8735A7aA2c3097E4064A49C"; // PAUSED
  const contractAddTimeBased = "0xeBFFa6B58858a4198c79FA26Bc07A2A626BF6E81"; // CLOSED

  // Contract Address of CustomLogic Keeper
  const contractCustomLogic = "0xB15B83f0f0805434799dC251eb5578cb979Dd360";

  // Contract Address CountEmitLog.sol
  const contractCountEmitLog = "0x2390639E34bE0a94693d5326F8AbE73264bC9CC9";

  // Contract Address CountWithLog.sol
  const contractCountWithLog = "0x301B858dE0771A903552d9b1a4DC86749f0f5928";

  useEffect(() => {
    if (window.ethereum) {
      const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(tempProvider);
    } else {
      alert("Please install MetaMask!");
    }
  }, []);

  const connectWallet = async () => {
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
    setIsConnected(true);
  };

  const handleTimeBasedKeeper = async () => {
    if (!provider) return;

    try {
      // Initialize the contract
      const contractTimeBasedKeeper = new ethers.Contract(
        contractAddTimeBased,
        timeBasedABI,
        provider
      );
      // Call the function
      const latestCounter = await contractTimeBasedKeeper.counter();
      setLastCounter(latestCounter.toString());

      //alert(`Latest counter: ${latestCounter}`);
    } catch (error) {
      console.error("Error fetching TimeBased Keeper:", error);
      alert("Error fetching TimeBased Keeper");
    }
  };

  const handleCustomLogicKeeperStatus = async () => {
    if (!provider) return;

    try {
      // Initialize the contract
      const contractCustomLogicKeeper = new ethers.Contract(
        contractCustomLogic,
        customLogicABI,
        provider
      );
      // Call the function
      const totalMinted = await contractCustomLogicKeeper.totalMinted();
      const maxMintable = await contractCustomLogicKeeper.maxMintable();
      const mintingStopped = await contractCustomLogicKeeper.mintingStopped();
      setTotalMinted(totalMinted.toString());
      setMaxMintable(maxMintable.toString());
      setMintingStopped(mintingStopped.toString());
      //alert(`Latest counter: ${mintingStopped}`);
    } catch (error) {
      console.error("Error fetching Custom Logic Keeper:", error);
      alert("Error fetching Custom Logic Keeper");
    }
  };

  const handleCountEmitLogKeeper = async () => {
    if (!provider) return;

    try {
      // Create signer
      const signer = provider.getSigner();

      // Initialize the contract
      const contractCountEmitLogKeeper = new ethers.Contract(
        contractCountEmitLog,
        countEmitLogABI,
        signer
      );
      // Call the function and this function emits an event
      // emitting events doesn't return any value directly. Instead, events are logged in the transaction logs,
      // and you can access the event data through the logs. So, when you call emitCountLog, it
      // triggers the emission of the WantsToCount event, but the function itself doesn’t return anything useful (it’s a void function).
      const counterEmitLog = await contractCountEmitLogKeeper.emitCountLog();
    } catch (error) {
      console.error("Error fetching CountEmitLog Keeper:", error);
      alert("Error fetching CountEmitLog Keeper");
    }
  };

  const handleCountWithLogKeeper = async () => {
    if (!provider) return;

    try {
      // Initialize the contract
      const contractCountWithLogKeeper = new ethers.Contract(
        contractCountWithLog,
        countWithLogABI,
        provider
      );
      // Call the function and this function emits an event
      // emitting events doesn't return any value directly. Instead, events are logged in the transaction logs,
      // and you can access the event data through the logs. So, when you call emitCountLog, it
      // triggers the emission of the WantsToCount event, but the function itself doesn’t return anything useful (it’s a void function).
      const counterWithLog = await contractCountWithLogKeeper.counted();
      setCounterWithLog(counterWithLog.toString());

      // Get the logs from event
      async function getLogs() {
        // Get the current block number
        const currentBlock = await provider.getBlockNumber();

        // Calculate the block range for the last 50,000 blocks
        const fromBlock = currentBlock - 50000;
        const toBlock = "latest"; // 'latest' indicates the most recent block

        // Define the filter for the event (you can filter by topics if needed)
        const filter = contractCountWithLogKeeper.filters.CountedBy(); // No arguments, so empty filter

        // Get logs for the `CountedBy` event within the last 50,000 blocks
        const logs = await contractCountWithLogKeeper.queryFilter(
          filter,
          fromBlock,
          toBlock
        );

        // Log the results
        logs.forEach((log) => {
          const decodedLog =
            contractCountWithLogKeeper.interface.decodeEventLog(
              "CountedBy", // Event name
              log.data, // The log data (event payload)
              log.topics // The log's topics (indexed arguments)
            );

          console.log("Log:", decodedLog);
        });
      }

      // Call the function to fetch the logs
      getLogs().catch((err) => console.error(err));
    } catch (error) {
      console.error("Error fetching CountEmitLog Keeper:", error);
      alert("Error fetching CountEmitLog Keeper");
    }
  };

  return (
    <div>
      <h2>Chainlink</h2>
      <p>Connected as: {account}</p>
      <p>
        Chainlink is a decentralized oracle network that enables smart contracts
        to securely connect to external data sources, APIs, and payment systems.
      </p>
      <p>
        Learn more about Chainlink automation at the official documentation:
        <br />
        <a
          href="https://docs.chain.link/chainlink-automation/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chainlink Automation Documentation
        </a>
      </p>
      {!isConnected ? (
        <button onClick={connectWallet} className="connect-button">
          Connect Wallet
        </button>
      ) : (
        <div className="connected">
          <div className="card">
            <h3>Time-Based Keeper: actions depending on time</h3>
            <p>
              Basic Keeper that automatically increments a counter by 1 every
              minute.
            </p>
            <p>Use cases: auction expiry, distribution of rewards. </p>
            <button onClick={handleTimeBasedKeeper} className="action-button">
              Test Keeper
            </button>
            <p>Last counter: {lastCounter}</p>
          </div>

          <div className="card">
            <h3>Custom Logic Keeper: actions depending on conditions</h3>
            <p>
              It allows the use of conditions for triggering specific actions,
              all defined within the smart contract. Chainlink Custom Logic
              Keepers monitor these conditions off-chain (checkUpkeep) and
              execute the desired functions on-chain when the conditions are met
              (performUpkeep).{" "}
            </p>
            <p>
              Use cases: liquidating loans (lending protocols), monitoring NFT
              minting process.{" "}
            </p>
            <button
              onClick={handleCustomLogicKeeperStatus}
              className="action-button"
            >
              Test Keeper
            </button>
            <p>Total minted: {totalMinted}</p>
            <p>Max Mintable: {maxMintable}</p>
            <p>Minting stopped? {mintingStopped}</p>
          </div>

          <div className="card">
            <h3>
              Log-triggered automation: emit log in 1st contract triggers action
              in 2nd contract.
            </h3>
            <p>
              Emits the event, containing the address of the sender and this log
              is stored at the blockchain. Chainlink Keepers detect and checks
              the event log (function checkLog). Next it triggers action and
              updates the counter (function performUpkeep).
            </p>
            <p>
              Use case: Automating actions triggered by specific events (e.g.,
              auction bids, price changes, or user interactions).
            </p>
            <div className="button-container">
              <button
                onClick={handleCountEmitLogKeeper}
                className="action-button"
              >
                Emit log Keeper
              </button>

              <button
                onClick={handleCountWithLogKeeper}
                className="action-button"
              >
                Get Log
              </button>
            </div>
            <p>Counter: {counterWithLog}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chainlink;
