import "./App.css";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "./ABI.json"; // Import the ABI JSON
import contractABIAuthority from "./AuthorityABI.json"; // Import the ABI JSON

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
  const [nftBalances, setNftBalances] = useState({
    sword: 0,
    shield: 0,
    armor: 0,
    health: 0,
    currency: 0,
    gold: 0,
    mysteryCard: 0,
  });

  // TWo problems remaining:
  // 1) I am only using a general alert statement for the minting requirement. Preferably I would read them from Solidity.
  // 2) The number of NFts are displayed correctly, but you need to disconnect and reconnect the wallet first!

  // Your contract address and ABI
  const contractAddress = "0x0f3038022f0423cb1e1f26a35af7f97ef966318c"; // NFT address
  const authorityAddress = "0x9737383a6a1a3ab56073f4254491c14a45075c13"; // CA authority

  // Function to fetch the number of NFTs (balance of each token)
  const getNFTBalances = async () => {
    if (!signer) return;

    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const userAddress = await signer.getAddress();

    // Fetch balances for each token type (IDs 0 to 6)
    const swordBalance = await contract.balanceOf(userAddress, 0); // Sword (token 0)
    const shieldBalance = await contract.balanceOf(userAddress, 1); // Shield (token 1)
    const armorBalance = await contract.balanceOf(userAddress, 2); // Armor (token 2)
    const healthBalance = await contract.balanceOf(userAddress, 3); // Health (token 3)
    const currencyBalance = await contract.balanceOf(userAddress, 4); // Currency (token 4)
    const goldBalance = await contract.balanceOf(userAddress, 5); // Gold (token 5)
    const mysteryCardBalance = await contract.balanceOf(userAddress, 6); // Mystery card (token 6)

    // Update the state with the fetched balances
    setNftBalances({
      sword: swordBalance.toString(),
      shield: shieldBalance.toString(),
      armor: armorBalance.toString(),
      health: healthBalance.toString(),
      currency: currencyBalance.toString(),
      gold: goldBalance.toString(),
      mysteryCard: mysteryCardBalance.toString(),
    });
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = provider.getSigner();

        // Set signer in state
        setSigner(signer);

        // Request the user to connect their wallet
        const accounts = await provider.send("eth_requestAccounts", []);
        setUserAddress(accounts[0]);
        setProvider(provider);
        setIsConnected(true);

        // Get network information from the user
        const network = await provider.getNetwork();
        setNetworkName(network.name);
        setChainId(network.chainId);

        // Get Balance from the user
        const balanceOf = await provider.getBalance(accounts[0]);
        const balanceInEther = ethers.utils.formatEther(balanceOf);
        const roundedBalance = Number(balanceInEther).toFixed(2);
        setBalance(roundedBalance);

        // If not on Polygon, prompt the user to switch
        if (network.chainId !== 137) {
          try {
            await switchToPolygon();
            const updatedSigner = provider.getSigner();
            setSigner(updatedSigner); // Update the signer
            getNFTBalances(); // Fetch NFTs after the network switch
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
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x89" }], // "0x89" is the hex for 137 (Polygon Mainnet)
      });
      setMessage(""); // Clear message after switching
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

  // useEffect(() => {
  //   if (signer && chainId === 137) {
  //     getNFTBalances();
  //   }

  //   if (window.ethereum) {
  //     // Listen for network changes
  //     window.ethereum.on("chainChanged", async (chainId) => {
  //       const newChainId = parseInt(chainId, 16); // Convert chainId from hex to decimal
  //       setChainId(newChainId); // Update the chainId in state

  //       // Get updated network details
  //       const provider = new ethers.providers.Web3Provider(window.ethereum);
  //       const network = await provider.getNetwork();
  //       setNetworkName(network.name);

  //       // Check if the user is connected to Polygon
  //       if (newChainId !== 137) {
  //         setMessage("You are not connected to the Polygon network.");
  //       } else {
  //         setMessage(""); // Clear the message if they are on Polygon
  //         if (signer && chainId === 137) {
  //           getNFTBalances();
  //         }
  //       }
  //     });

  //     // Listen for account changes
  //     window.ethereum.on("accountsChanged", (accounts) => {
  //       if (accounts.length > 0) {
  //         setUserAddress(accounts[0]);
  //       } else {
  //         disconnectWallet(); // Handle wallet disconnection
  //       }
  //     });

  //   }
  // }, [signer, chainId]);

  useEffect(() => {
    if (signer && chainId === 137) {
      getNFTBalances();
    }

    const handleChainChanged = async (chainId) => {
      const newChainId = parseInt(chainId, 16); // Convert chainId from hex to decimal
      setChainId(newChainId); // Update chainId state

      try {
        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        const newNetwork = await newProvider.getNetwork();

        // Ensure the new chain matches before proceeding
        if (newNetwork.chainId !== newChainId) {
          console.error(
            `Mismatch between chainId ${newChainId} and detected network ${newNetwork.chainId}`
          );
          return;
        }

        setProvider(newProvider);
        setNetworkName(newNetwork.name);

        if (newChainId !== 137) {
          setMessage("You are not connected to the Polygon network.");
          // Temporarily clear the provider and signer while switching
          setProvider(null);
          setSigner(null);
          setBalance("");
          setNftBalances({
            sword: 0,
            shield: 0,
            armor: 0,
            health: 0,
            currency: 0,
            gold: 0,
            mysteryCard: 0,
          });
        } else {
          setMessage(""); // Clear the message if on Polygon

          const newSigner = newProvider.getSigner();
          setSigner(newSigner);

          // Fetch balances only after confirming chain is Polygon and signer is valid
          if (newSigner) {
            await getNFTBalances(newSigner);
          }
        }
      } catch (error) {
        console.error("Error handling chainChanged", error);
      }
    };

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
      } else {
        disconnectWallet(); // Handle wallet disconnection
      }
    };

    if (window.ethereum) {
      // Add listeners
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    // Cleanup listeners on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, [chainId, signer]); // Run when chainId or signer changes

  // Function to buy an NFT
  // Users cant mint directly from smart contract: authority handles this process!

  async function buyNFT(tokenId) {
    try {
      const signer = provider.getSigner();

      const authorityContract = new ethers.Contract(
        authorityAddress,
        contractABIAuthority,
        signer
      );

      // Call the authority contract's mint function
      const tx = await authorityContract.mintNFT(
        signer.getAddress(),
        tokenId,
        1,
        { gasLimit: ethers.utils.hexlify(1000000) } // Setting a gas limit of 1,000,000
      );
      await tx.wait(); // Wait for the transaction to be confirmed

      getNFTBalances(); // Update the NFT balances

      console.log(`Successfully purchased token ${tokenId}`);
    } catch (error) {
      console.error("Error buying NFT:", error);
      // Handle user rejection (MetaMask error code 4001)
      // Check if the error message contains "user rejected transaction"
      if (
        error.message &&
        error.message.includes("user rejected transaction")
      ) {
        alert("User canceled the transaction.");
      } else if (error.data && error.data.message) {
        // Handle Solidity custom error message if available
        alert("Error: " + error.data.message);
      } else if (error.reason) {
        // Handle Ethers.js specific reason
        alert("Transaction failed: " + error.reason);
      } else {
        // Generic error message for other cases
        alert("Transaction failed: please check minting requirements!");
      }
    }
  }

  return (
    <div className="App">
      <header>
        <div className="website-header">
          <h1>Welcome to the NFT Game</h1>
        </div>
      </header>

      <div className="flex-container">
        <div className="left-box">
          <h1>Rules of the NFT Game</h1>
          <h2>Token Information</h2>
          <ul>
            <li>We have 7 tokens with collection ID [0-6]</li>
            <li>There is no supply limit</li>
            <li>Tokens 0-2 are free to mint (1 minute cooldown)</li>
          </ul>
          <h2>Minting Requirements</h2>
          <ul>
            <li>Token 3 can be minted by burning token 0 and 1</li>
            <li>Token 4 can be minted by burning token 1 and 2</li>
            <li>Token 5 can be minted by burning token 0 and 2</li>
            <li>Token 6 can be minted by burning token 0, 1, and 2</li>
          </ul>
        </div>

        {/* NFT Summary Box */}
        <div className="summary-box">
          <h1>Number of NFTs</h1>
          <div className="item">
            <p>Sword (token 0): {nftBalances.sword}</p>
            <button onClick={() => buyNFT(0)}>Buy Sword</button>
          </div>
          <div className="item">
            <p>Shield (token 1): {nftBalances.shield}</p>
            <button onClick={() => buyNFT(1)}>Buy Shield</button>
          </div>
          <div className="item">
            <p>Armor (token 2): {nftBalances.armor}</p>
            <button onClick={() => buyNFT(2)}>Buy Armor</button>
          </div>
          <div className="item">
            <p>Health (token 3): {nftBalances.health}</p>
            <button onClick={() => buyNFT(3)}>Buy Health</button>
          </div>
          <div className="item">
            <p>Currency (token 4): {nftBalances.currency}</p>
            <button onClick={() => buyNFT(4)}>Buy Currency</button>
          </div>
          <div className="item">
            <p>Gold (token 5): {nftBalances.gold}</p>
            <button onClick={() => buyNFT(5)}>Buy Gold</button>
          </div>
          <div className="item">
            <p>Mystery card (token 6): {nftBalances.mysteryCard}</p>
            <button onClick={() => buyNFT(6)}>Buy Mystery card</button>
          </div>
        </div>

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
              <div className="nft-collection-link">
                <p>Check out the NFT collection on OpenSea:</p>
                <a
                  href="https://opensea.io/assets/matic/0x0f3038022f0423cb1e1f26a35af7f97ef966318c/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on OpenSea
                </a>
              </div>
              {/* Image of knight */}
              <div className="knight-container">
                <img src="/knight.png" alt="Knight" className="knight-image" />
              </div>
            </div>
          </div>
        )}

        {/* Introduce buttons with own class for CSS*
      <div className="buttons-container">
        {/* <button onClick={() => alert("Button clicked!")}>Claim NFT</button> 
      </div>
      */}
      </div>
    </div>
  );
}

export default App;
