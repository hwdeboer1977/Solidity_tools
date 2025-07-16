import "./App.css";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { createMerkleTree } from "./merkle_tree";
import MerkleTreeMapABI from "./ABI/MerkleTreeMap.json"; // Import ABI
import MerkleTreeBitABI from "./ABI/MerkleTreeBit.json"; // Import ABI
import MerkleTreeBitCommitABI from "./ABI/MerkleTreeBitCommit.json"; // Import ABI

function App() {
  /* Initialize state variables */
  const [userAddress, setUserAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkName, setNetworkName] = useState("");
  const [chainId, setChainId] = useState(null);
  const [message, setMessage] = useState("");
  const [balance, setBalance] = useState(null);
  const [signer, setSigner] = useState(null);
  const [commitment, setCommitment] = useState(""); // To store the generated commitment
  const [secret, setSecret] = useState(""); // To store user-entered secret
  const [currentState, setCurrentState] = useState(null);
  const [stageNumber, setStageNumber] = useState("");
  const [randomId, setRandomId] = useState("");

  // Your contract address and ABI for contract with Map
  const contractAddressMap = "0xbBc882672F7C6bFd16838947f4dD9d8C0bB20bcC"; // MerkleTreeMap
  const contractABIMap = MerkleTreeMapABI; // Use the imported ABI

  // Your contract address and ABI for contract with BitMap
  const contractAddressBit = "0xe12161DD46C16373B2365525905d084e76Cd8e64";
  const contractABIBit = MerkleTreeBitABI; // Use the imported ABI

  const contractAddressBitCommit = "0xc25746E53010e652f3965028df12284E54A748b8";
  const contractABIBitCommit = MerkleTreeBitCommitABI;

  // Initialize state variables Merkle Tree
  const [inputAddress, setInputAddress] = useState("");
  const [rootHash, setRootHash] = useState("");
  const [hexProof, setHexProof] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(false);

  ////// BEGIN Code for metamask wallet plugin ////////////
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = provider.getSigner();

        // Set signer in state
        setSigner(signer);
        setProvider(provider);
        setIsConnected(true);

        // Get user's account address
        const accounts = await provider.listAccounts();
        setUserAddress(accounts[0]);

        // Get network information from the user
        const network = await provider.getNetwork();
        setNetworkName(network.name);
        setChainId(network.chainId);

        // // Get Balance from the user
        const balanceOf = await provider.getBalance(accounts[0]);
        const balanceInEther = ethers.utils.formatEther(balanceOf);
        const roundedBalance = Number(balanceInEther).toFixed(2);
        setBalance(roundedBalance);

        // If not on Polygon, prompt the user to switch
        if (network.chainId !== 137) {
          try {
            await switchToPolygon();
          } catch (error) {
            setMessage(
              "You are not connected to the Polygon network. Please switch to Polygon manually."
            );
          }
        } else {
          setMessage(""); // Clear the message if already on Polygon
        }
      } else {
        alert(
          "MetaMask is not installed. Please install MetaMask to use this app."
        );
      }
    } catch (error) {
      console.error("Error connecting to MetaMask", error);
    }
  };

  // Function to disconnect the wallet from Metamask
  const disconnectWallet = () => {
    setUserAddress(null);
    setProvider(null);
    setIsConnected(false);
    setSigner(null);
    setNetworkName("");
    setChainId("");
    setBalance("");
    setMessage("");
  };

  // Function to prompt user to switch to the Polygon Mainnet network
  const switchToPolygon = async () => {
    try {
      // Reset provider and signer immediately before switching chains
      setProvider(null);
      setSigner(null);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x89" }], // "0x89" is the hex for 137 (Polygon Mainnet)
      });

      // Set up new provider and signer after switching to Polygon
      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(newProvider);
      const newSigner = newProvider.getSigner();
      setSigner(newSigner);

      const newNetwork = await newProvider.getNetwork();
      setNetworkName(newNetwork.name);
      setChainId(newNetwork.chainId);

      setMessage(""); // Clear message after switching successfully
    } catch (error) {
      if (error.code === 4902) {
        // Error code 4902 indicates the chain has not been added to MetaMask
        setMessage(
          "Polygon network not found. Please add it to MetaMask manually."
        );
      } else if (error.code === 4001) {
        // Error code 4001 indicates the user rejected the request
        setMessage("Network switch was rejected by the user.");
      } else {
        // Any other error
        setMessage("Failed to switch network. Please try again.");
      }
      console.error("Error switching network:", error);
    }
  };

  ////// END Code for metamask wallet plugin ////////////

  useEffect(() => {
    // Fetch current state if the signer is set and the user is on the Polygon network
    const fetchCurrentState = async () => {
      if (signer && chainId === 137) {
        try {
          const contract = new ethers.Contract(
            contractAddressBitCommit,
            contractABIBitCommit,
            signer
          );
          const state = await contract.currentState(); // Fetch the current state from the contract
          setCurrentState(state.toString()); // Update the state variable
        } catch (error) {
          console.error("Error fetching current state:", error);
        }
      }
    };

    const listenForRandomId = () => {
      if (!signer) return;

      const contract = new ethers.Contract(
        contractAddressBitCommit,
        contractABIBitCommit,
        signer
      );

      // Listen for the reveal event
      contract.on("Reveal", (user, randomId) => {
        console.log(
          `Reveal event: user=${user}, randomId=${randomId.toString()}`
        );
        setRandomId(randomId.toString()); // Update the randomId state
      });
    };

    const listenForStateChange = () => {
      if (signer && chainId === 137) {
        const contract = new ethers.Contract(
          contractAddressBitCommit,
          contractABIBitCommit,
          signer
        );

        // Listen for the StateChanged event
        contract.on("StateChanged", (newState) => {
          console.log("State changed:", newState);
          setCurrentState(newState.toString());
        });
      }
    };

    // Fetch current state if the signer is set and the user is on the Polygon network
    if (signer && chainId === 137) {
      fetchCurrentState();
      listenForStateChange();
      listenForRandomId();
    }

    // Listen for account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        // Reset NFT balances when the account changes
        setUserAddress(accounts[0]);

        // Fetch new NFT balances for the new account (if on the correct chain)
        if (signer && chainId === 137) {
        }
      } else {
        disconnectWallet(); // Handle wallet disconnection
      }
    };

    // Listen for network changes
    const handleChainChanged = async (newChainId) => {
      const parsedChainId = parseInt(newChainId, 16); // Convert chainId from hex to decimal
      setChainId(parsedChainId);

      // Reset provider, signer, balances when chain changes
      setProvider(null);
      setSigner(null);
      setBalance("");

      if (parsedChainId !== 137) {
        setMessage("You are not connected to the Polygon network.");
      } else {
        setMessage(""); // Clear the message if on Polygon
        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        const newSigner = newProvider.getSigner();
        setProvider(newProvider);
        setSigner(newSigner);

        // Fetch new balances if on the correct chain
        if (newSigner) {
          // getNFTBalances();
        }
      }
    };

    // Set up listeners for account and network changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Cleanup listeners on component unmount or effect re-run
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);

      if (signer) {
        const contract = new ethers.Contract(
          contractAddressBitCommit,
          contractABIBitCommit,
          signer
        );
        contract.removeAllListeners("StateChanged");
        contract.removeAllListeners("Reveal");
      }
    };
  }, [signer, chainId]);

  // Function to set wallet address
  const handleAddressChange = (event) => {
    setInputAddress(event.target.value);
  };

  // Check is wallet address is whitelisted
  const checkWhitelist = () => {
    if (!inputAddress) {
      alert("Please enter a valid wallet address.");
      return;
    }

    try {
      const { hexProof, rootHash, verified } = createMerkleTree(inputAddress);
      setHexProof(hexProof);
      setRootHash(rootHash);
      setVerificationStatus(verified);
    } catch (error) {
      console.error("Error checking whitelist:", error);
      alert("Error verifying address. Please ensure it's valid.");
    }
  };

  // Function to call mintmap function
  const callMintMapping = async () => {
    if (!connectWallet) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = new ethers.Contract(
        contractAddressMap,
        contractABIMap,
        signer
      );

      // Use the hexProof from the input box
      const tx = await contract.mintMapping(hexProof);
      const receipt = await tx.wait(); // Wait for the transaction to be mined
      alert("Minting successful! Transaction Hash: " + receipt.transactionHash);
    } catch (err) {
      console.error("Error calling mintMapping:", err);
      alert("Error: " + err.message);
    }
  };

  // Function to call mintmap function
  const callMintBitMap = async () => {
    if (!connectWallet) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = new ethers.Contract(
        contractAddressBit,
        contractABIBit,
        signer
      );

      // Use the hexProof from the input box
      const tx = await contract.mintBitMap(hexProof);
      const receipt = await tx.wait(); // Wait for the transaction to be mined
      alert("Minting successful! Transaction Hash: " + receipt.transactionHash);
    } catch (err) {
      console.error("Error calling mintMapping:", err);
      alert("Error: " + err.message);
    }
  };

  // Function to call commit function
  const callMintBitMapCommit = async () => {
    if (!connectWallet) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = new ethers.Contract(
        contractAddressBitCommit,
        contractABIBitCommit,
        signer
      );

      // Use the commit from the output box
      const tx = await contract.commit(commitment);
      const receipt = await tx.wait(); // Wait for the transaction to be mined
      alert("Minting successful! Transaction Hash: " + receipt.transactionHash);
    } catch (err) {
      console.error("Error calling mintMapping:", err);
      alert("Error: " + err.message);
    }
  };

  // Function to call reveal function
  const callMintBitMapReveal = async () => {
    if (!connectWallet) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const contract = new ethers.Contract(
        contractAddressBitCommit,
        contractABIBitCommit,
        signer
      );

      // Use the commit from the output box
      const tx = await contract.reveal(secret);
      const receipt = await tx.wait(); // Wait for the transaction to be mined
      alert("Minting successful! Transaction Hash: " + receipt.transactionHash);
    } catch (err) {
      console.error("Error calling mintMapping:", err);
      alert("Error: " + err.message);
    }
  };

  const ownerSetState = async (stageNumber) => {
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const contract = new ethers.Contract(
        contractAddressBitCommit,
        contractABIBitCommit,
        signer
      );

      // Call the setState function on the smart contract
      const tx = await contract.setState(stageNumber, {
        gasLimit: 100000, // Adjust the gas limit as needed
      });

      await tx.wait(); // Wait for the transaction to be mined
      alert("Stage set successfully! Transaction Hash: " + tx.hash);
    } catch (error) {
      console.error("Error setting state:", error);
      alert("Error: " + error.message);
    }
  };

  // Function to generate the commit by inserting secret
  const generateCommitment = async () => {
    if (!userAddress) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!secret) {
      alert("Please enter a secret.");
      return;
    }

    try {
      // Generate the commitment hash
      const commitmentHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(["string", "address"], [secret, userAddress])
      );
      setCommitment(commitmentHash);
    } catch (error) {
      console.error("Error generating commitment:", error);
      setMessage("Failed to generate commitment.");
    }
  };

  return (
    <div className="App">
      <header>
        <div className="website-header">
          <h1>Advanced NFT assignment</h1>
        </div>
      </header>
      <div className="main-layout">
        <div>
          {/* Left Section */}
          <div className="left-box">
            <h2>Things to do:</h2>
            <ol className="todo-list">
              <li>
                Implement a merkle tree airdrop where addresses in the merkle
                tree are allowed to mint once. Measure the gas cost of using a
                mapping to track if an address already minted vs tracking each
                address with a bit in a bitmap.
              </li>
              <li>
                Use commit reveal to allocate NFT ids randomly. The reveal
                should be 10 blocks ahead of the commit.
              </li>
              <li>
                Add multicall to the NFT so people can transfer several NFTs in
                one transaction.
              </li>
              <li>
                The NFT should use a state machine to determine if mints can
                happen, the presale is active, the public sale is active, or the
                supply has run out.
              </li>
              <li>
                Designated address should be able to withdraw funds using the
                pull pattern. You should be able to withdraw to an arbitrary
                number of contributors.
              </li>
            </ol>
          </div>
        </div>
        {/* Middle Section */}
        <div className="center-box">
          <h1>Merkle Tree DApp</h1>
          {/* Input field for wallet address */}
          <div>
            <input
              type="text"
              placeholder="Enter wallet address"
              value={inputAddress}
              onChange={handleAddressChange}
              className="common-input"
            />
            <button onClick={checkWhitelist} className="common-button">
              1. Check Whitelist
            </button>
          </div>
          {/* Input field for Merkle proof for Mint with mapping*/}
          <div>
            <input
              type="text"
              placeholder="[Enter Merkle proof, comma-separated]"
              value={hexProof}
              onChange={(e) =>
                setHexProof(e.target.value.split(",").map((x) => x.trim()))
              }
              className="common-input"
            />
            <button onClick={callMintMapping} className="common-button">
              2a. Mint with Mapping
            </button>
          </div>
          {/* Input field for Merkle proof for Mint with BitMap*/}
          <div>
            <input
              type="text"
              placeholder="[Enter Merkle proof, comma-separated]"
              value={hexProof}
              onChange={(e) =>
                setHexProof(e.target.value.split(",").map((x) => x.trim()))
              }
              className="common-input"
            />
            <button onClick={callMintBitMap} className="common-button">
              2b. Mint with Bitmap
            </button>
          </div>

          {/* Owner can setState here */}
          <div>
            <input
              type="text"
              placeholder="Set stage number"
              value={stageNumber} // Bind input value to state
              onChange={(e) => setStageNumber(e.target.value)} // Update state on input change
              className="common-input"
            />
            <button
              onClick={() => ownerSetState(stageNumber)}
              className="common-button"
            >
              3. Owner setState
            </button>
          </div>

          {/* Input field to commit secret for commit/reveal*/}
          <input
            type="text"
            placeholder="Enter your secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="common-input"
          />
          <button onClick={generateCommitment} className="common-button">
            4. Generate Commit
          </button>

          {/* Input field to commit secret for commit/reveal*/}
          <div>
            <input
              type="text"
              placeholder="Use commit below first"
              value={commitment}
              className="common-input"
            />
            <button onClick={callMintBitMapCommit} className="common-button">
              5. Call commit function
            </button>
          </div>

          {/* Input field to reveal  */}
          <div>
            <input
              type="text"
              placeholder="Put your secret"
              value={secret}
              className="common-input"
            />
            <button onClick={callMintBitMapReveal} className="common-button">
              6. Call reveal function
            </button>
          </div>

          {/* Display results */}
          <div style={{ marginTop: "10px" }}>
            <h3>Merkle Proof:</h3>
            <pre>{JSON.stringify(hexProof, null, 2)}</pre>
            <h3>Root Hash:</h3>
            <p>{rootHash === null ? "Enter an address to check." : rootHash}</p>
            <h3>Verification Status:</h3>
            <p>
              {verificationStatus === null
                ? "Enter an address to check."
                : verificationStatus
                ? "Address is whitelisted!"
                : "Address is not whitelisted."}
            </p>
          </div>

          {/* Get information current round of NFT sales */}
          <div style={{ padding: "10px" }}>
            <h3>Current NFT Sale State:</h3>
            {currentState !== null ? (
              <p>{currentState}</p>
            ) : (
              <p>Loading current state...</p>
            )}
          </div>

          <div>
            <h3>Random ID:</h3>
            {randomId !== null ? (
              <p>{randomId}</p>
            ) : (
              <p>No Random ID generated yet.</p>
            )}
          </div>

          <br />
          <br />
          {/* Display Commitment */}
          {commitment && (
            <div>
              <h3>Generated Commit:</h3>
              <p>{commitment}</p>
            </div>
          )}
        </div>
        {/* Right Section */}
        <div className="right-box">
          {!isConnected ? (
            <div className="buttons-container">
              <button onClick={connectWallet}>Connect Wallet</button>
            </div>
          ) : (
            <div className="buttons-container">
              <button onClick={disconnectWallet}>Disconnect Wallet</button>
              {chainId !== 137 ? (
                <button onClick={switchToPolygon}>Switch to Polygon</button>
              ) : (
                <p>You are connected to Polygon</p> // Message or another UI element indicating the correct network
              )}
              {/* Wallet Info placed here, after the "connected" message */}
              <div className="wallet-info">
                <p>Connected as: {userAddress}</p>
                <p>Current chain: {networkName}</p>
                <p>Current balance: {balance}</p>
                <p>{message}</p>
              </div>
            </div>
          )}
          <h2>Bank Account</h2>
        </div>
      </div>
    </div>
  );
}

export default App;
