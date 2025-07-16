import React, { useState, useEffect } from "react";
import "./App.css";
import { ethers } from "ethers";
import pricefeedABI from "./pricefeedABI.json";
import uniswapv2twapABI from "./uniswapv2twap.json";
import uniswapv3twapABI from "./uniswapv3twap.json";
import randomVrfABI from "./randomVrfABI.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [priceFeedData, setPriceFeedData] = useState(null);
  const [randomNumber, setRandomNumber] = useState(null);
  const [priceV2TWAP, setPriceV2TWAP] = useState(null);
  const [priceV3TWAP, setPriceV3TWAP] = useState(null);

  const priceFeedAddress = "0x7Bf9573B49A5917A05061a53eD3FabADC4F4011e"; // CA price feed
  const uniswapV2TWAPCA = "0xad2a2Af865A52D489c59430b2451eC43797ef155";
  const ethV2Address = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
  const uniswapV3TWAPCA = "0x279879aF60F3a0a2550308c44650cB8cC17D258E";
  const randomVrfCA = "0xB3Fb947A7Cd16b03a28cE0755EE839ccAebd6D94";

  // Unidwap V2 pair ETH/USDC: https://www.geckoterminal.com/sepolia-testnet/pools/0x92b8274aba7ab667bee7eb776ec1de32438d90bf
  // Uniswap V3 pair UNI/WETH: https://www.geckoterminal.com/sepolia-testnet/pools/0x224cc4e5b50036108c1d862442365054600c260c

  // Uniswap V3 contract was deployed at 0x279879aF60F3a0a2550308c44650cB8cC17D258E
  // On SEPOLIA contract factory address v3 = 0x0227628f3F023bb0B980b67D528571c95c6DaC1c
  // WETH: 0xfff9976782d46cc05630d1f6ebab18b2324d6b14
  const addressUNI = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
  const fee = 500; //(=0.5%)

  // VRF random generator Chainlink
  // READ THIS: https://docs.chain.link/vrf/v2-5/subscription/get-a-random-number
  // Method 1 WITH SUBSCRIPTION: 55069346387207556453154772401070057443819540065621440100873261129182523049733
  // Only subscription is working, with native coin I get gas error
  // Contract is deployed at: 0xA910D58f1E10296C2C44EdB52e57b3097DAea555
  // Next: call function requestRandomWords()

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

  const handlePriceFeedOracle = async () => {
    if (!provider) return;

    try {
      // Initialize the contract
      const contractPriceFeed = new ethers.Contract(
        priceFeedAddress,
        pricefeedABI,
        provider
      );
      // Call the function
      const latestPrice =
        await contractPriceFeed.getChainlinkDataFeedLatestAnswer();
      const priceInUnits = ethers.utils.formatUnits(latestPrice, 8); // Format with 8 decimals
      const priceWithoutDecimals = Math.floor(priceInUnits); // Truncate to integer
      setPriceFeedData(priceWithoutDecimals); // Format as needed, assuming 8 decimal places
      //alert(`Latest price feed data: ${latestPrice.toString()}`);
    } catch (error) {
      console.error("Error fetching price feed:", error);
      alert("Error fetching price feed");
    }
  };

  const handleUniswapV2TWAP = async () => {
    if (!provider) return;

    try {
      // Step 1: Get the signer from the provider
      const signer = provider.getSigner(); // This will get the user's signer (MetaMask or custom wallet)

      // Initialize the contract
      const contractTwapV2 = new ethers.Contract(
        uniswapV2TWAPCA,
        uniswapv2twapABI,
        signer
      );

      // Step 2: Call the `update()` function to update the TWAP price
      const tx = await contractTwapV2.update(); // This updates the TWAP price.

      // Wait for the transaction to be mined
      await tx.wait(); // Wait until the transaction is confirmed.

      // Step 3: Call the `consult()` function to get the new TWAP price
      const newPriceV2 = await contractTwapV2.consult(ethV2Address, 1); // This gets the new TWAP price
      // Format the price (assuming no decimals, you can adjust as needed)
      setPriceV2TWAP(ethers.utils.formatUnits(newPriceV2, 0)); // Formatting as needed

      // Show an alert with the new price (optional)
      // alert(
      //   `Latest Uniswap V2 TWAP: ${ethers.utils.formatUnits(newPriceV2, 0)}`
      // );
    } catch (error) {
      console.error("Error fetching uniswap V2 TWAP:", error);
      alert("Error fetching uniswap V2 TWAP");
    }
  };

  const handleUniswapV3TWAP = async () => {
    if (!provider) return;

    try {
      // Step 1: Get the signer from the provider
      const signer = provider.getSigner(); // This will get the user's signer (MetaMask or custom wallet)

      // Initialize the contract
      const contractTwapV3 = new ethers.Contract(
        uniswapV3TWAPCA,
        uniswapv3twapABI,
        signer
      );

      // Step 2: Call the `update()` function to update the TWAP price
      const newPriceV3 = await contractTwapV3.estimateAmountOut(
        addressUNI,
        1,
        fee
      ); // This updates the TWAP price.

      // Step 3: Call the `consult()` function to get the new TWAP price
      //const newPriceV2 = await contractTwapV2.consult(ethV2Address, 1); // This gets the new TWAP price
      // Format the price (assuming no decimals, you can adjust as needed)
      setPriceV3TWAP(ethers.utils.formatUnits(newPriceV3, 0)); // Formatting as needed

      console.log("New price: " + priceV3TWAP);

      // Show an alert with the new price (optional)
      // alert(
      //   `Latest Uniswap V3 TWAP: ${ethers.utils.formatUnits(newPriceV3, 0)}`
      // );
    } catch (error) {
      console.error("Error fetching uniswap V3 TWAP:", error);
      alert("Error fetching uniswap V3 TWAP");
    }
  };

  const handleVRFRequest = async () => {
    if (!provider) return;

    try {
      // Step 1: Get the signer from the provider
      const signer = provider.getSigner(); // This will get the user's signer (MetaMask or custom wallet)

      // Initialize the contract
      const contractRandomVrf = new ethers.Contract(
        randomVrfCA,
        randomVrfABI,
        signer
      );

      // Watch for pending transactions!
      // Call requestRandomWords function
      const request = await contractRandomVrf.requestRandomWords(false);
      await request.wait(); // Wait until the transaction is confirmed.
    } catch (error) {
      console.error("Error fetching random generator:", error);
      alert("Error fetching random generator");
    }
  };

  const handleVRFResponse = async () => {
    if (!provider) return;

    try {
      // Step 1: Get the signer from the provider
      const signer = provider.getSigner(); // This will get the user's signer (MetaMask or custom wallet)

      // Initialize the contract
      const contractRandomVrf = new ethers.Contract(
        randomVrfCA,
        randomVrfABI,
        signer
      );

      // Get latest request Id
      // Call getRequestStatus() specifying the requestId to display the random words.
      const getRequestId = await contractRandomVrf.lastRequestId();
      // const getRequestId = ethers.BigNumber.from(
      //   "59834262420892371826381571700056885306012499904253605480223682792827338025830"
      // );

      console.log("Request ID:", getRequestId.toString());

      // Get status
      const getRequestStatus = await contractRandomVrf.getRequestStatus(
        getRequestId
      );

      console.log("getRequestStatus: " + getRequestStatus);

      // Process and log random words
      const randomWords = getRequestStatus[1]; // Array of random words
      const randomWordsStrings = randomWords.map((word) => word.toString());

      console.log("Random Words:", randomWordsStrings);

      // Use the random words as needed
      const firstRandomWord = randomWordsStrings[0]; // Example: use the first random word
      console.log("First Random Word:", firstRandomWord);

      const lastRandomWord = randomWordsStrings[randomWordsStrings.length - 1]; // Example: use the first random word
      console.log("Last Random Word:", lastRandomWord);

      // Show an alert with the new price (optional)
      // alert(
      //   `Latest random numbers: ${ethers.utils.formatUnits(lastRandomWord, 0)}`
      // );
      setRandomNumber(ethers.utils.formatUnits(lastRandomWord, 0)); // Formatting as needed
    } catch (error) {
      console.error("Error fetching random generator:", error);
      alert("Error fetching random generator");
    }
  };

  return (
    <div className="App">
      <h1>Oracle dApp</h1>
      <h2>This dApp provides the following oracles:</h2>
      <ul className="custom-list">
        <li>🔗 ChainLink price feed</li>
        <li>🎲 ChainLink VRF</li>
        <li>📈 Uniswap TWAPs (V2 and V3)</li>
      </ul>

      {!isConnected ? (
        <button onClick={connectWallet} className="connect-button">
          Connect Wallet
        </button>
      ) : (
        <div className="connected">
          <p>Connected as: {account}</p>

          {/* Card 1: Price Feed Oracle */}
          <div className="card">
            <h2>🔗 ChainLink price feed</h2>
            <button onClick={handlePriceFeedOracle} className="action-button">
              Get Price Feed (BTC/USD)
            </button>
            {priceFeedData && <p>Latest Price Feed BTC/USD: {priceFeedData}</p>}
          </div>

          {/* Card 2: VRF Random Number */}
          <div className="card">
            <h2>🎲 ChainLink VRF </h2>
            <button onClick={handleVRFRequest} className="action-button">
              Step 1: Request Random Number
            </button>
            <button onClick={handleVRFResponse} className="action-button">
              Step 2: Read Random Number
            </button>
            {randomNumber && <p>Latest Random Number {randomNumber}</p>}
          </div>

          {/* Card 3: Uniswap TWAPs (based on tutorials)*/}
          <div className="card">
            <h2>📈 Uniswap TWAPs (based on tutorials)</h2>
            <button onClick={handleUniswapV2TWAP} className="action-button">
              Get Uniswap V2 TWAP (ETH/USD)
            </button>
            {priceV2TWAP && <p>Latest Price Feed ETH/USD: {priceV2TWAP}</p>}
            <button onClick={handleUniswapV3TWAP} className="action-button">
              Get Uniswap V3 TWAP (UNI/ETH)
            </button>
            {priceV3TWAP && <p>Latest Price Feed UNI/ETH: {priceV3TWAP}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
