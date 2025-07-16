import React, { useEffect, useState } from "react";
import "./Defender.css";

// Sending transactions via Defender Relay uses sensitive API keys (DEFENDER_RELAYER_KEY and DEFENDER_RELAYER_SECRET),
// we should not run this code on the frontend. Instead, create a backend route to run this code securely (see server.js).

function Defender() {
  // Function to handle relayer button: it only sends a simple transaction via the Relayer
  const handleTestRelayerClick = async () => {
    try {
      const response = await fetch("http://localhost:5000/run-relayer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("Response from relayer:", data);
      alert(`Transaction sent! Hash: ${data.txHash}`);
    } catch (error) {
      console.error("Error calling relayer:", error);
      alert("Failed to execute relayer.");
    }
  };

  // Function to handle monitor button: it only shows the Monitor we are currently running!
  // The monitor then sends the output (e.g. ETH/USDC transactions) to my Telegram account
  const handleTestMonitorClick = async () => {
    try {
      const response = await fetch("http://localhost:5000/run-monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("Response from relayer:", data);
      alert(`Monitor called! Monitor name: ${data.monitorName}`);
    } catch (error) {
      console.error("Error calling monitor:", error);
      alert("Failed to execute monitor.");
    }
  };

  return (
    <div>
      <h2>OpenZeppelin Defender</h2>
      <p>
        OpenZeppelin Defender is a developer platform to code, audit, deploy,
        monitor, and operate blockchain applications.
      </p>
      <p>
        Learn more about Defender at the official documentation:
        <br />
        <a
          href="https://docs.openzeppelin.com/defender/"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenZeppelin Defender Documentation
        </a>
      </p>

      <div className="card">
        <h3>Defender Relayer: Transaction Automation</h3>
        <p>
          Defender Relayer is a secure and managed service for automating
          blockchain transactions. It allows transactions to be sent
          programmatically from a secure infrastructure without exposing private
          keys.
        </p>
        <h4>Use Cases:</h4>
        <ul>
          <li>
            Automating loan repayments in lending protocols to avoid
            liquidation.
          </li>
          <li>Releasing funds automatically in vesting contracts.</li>
        </ul>

        <button className="action-button" onClick={handleTestRelayerClick}>
          Test Relayer
        </button>
      </div>

      <div className="card">
        <h3>Defender Monitor:</h3>
        <p>
          Defender Monitor allows you to create real-time alerts for events
          related to smart contracts and blockchain activity.
        </p>
        <h4>Use Cases:</h4>
        <ul>
          <li>
            Track DeFi metrics like transaction volume or specific user
            activity.
          </li>
          <li>
            Security Monitoring, such as large withdrawals or frequent contract
            calls indicating a potential attack.
          </li>
        </ul>
        <button className="action-button" onClick={handleTestMonitorClick}>
          Test Monitor
        </button>
      </div>
    </div>
  );
}

export default Defender;
