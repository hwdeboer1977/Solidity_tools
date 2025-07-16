import React from "react";
//import { createClient } from "urql";
import { createClient, cacheExchange, fetchExchange } from "@urql/core";
import { useEffect, useState } from "react";
import "./TheGraph.css";

// Minimalistic Example of The Graph Protocol
// It only fetches the first 5 transactions of the CryptoPunks NFTs

const APIURL =
  "https://api.studio.thegraph.com/query/99607/ethglobaltutorial/version/latest";

const query = `
  query {
    transfers(first: 5) {
      id
      from
      to
      value
    }
  }
`;

const client = createClient({
  url: APIURL,
  exchanges: [cacheExchange, fetchExchange],
});

function TheGraph() {
  // State to store fetched transfers
  const [transfers, setTransfers] = useState([]);
  // State for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data function triggered by the button click
  const fetchData = async () => {
    setLoading(true); // Set loading state to true when fetching starts
    setError(null); // Clear any previous error
    try {
      const response = await client.query(query).toPromise();
      console.log("response:", response);
      if (response.error) {
        setError(response.error.message);
      } else {
        setTransfers(response.data.transfers);
      }
    } catch (err) {
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false); // Set loading state to false when fetching ends
    }
  };

  return (
    <div className="TheGraph">
      <h2>The Graph Protocol</h2>
      <p>
        The Graph is a decentralized protocol for indexing and querying
        blockchain data, enabling developers to build APIs that provide
        blockchain data in real-time.
      </p>
      <p>
        {" "}
        The Graph Protocol is a better way to query and organize blockchain data
        than directly relying on tools like Etherscan APIs.
      </p>
      <div className="card">
        <h3>Advantages of The Graph Protocol</h3>
        <ul>
          <li>
            <h4>Custom Data Organization:</h4>
            <p>
              The Graph allows you to define a subgraph, which is a schema that
              specifies exactly how to organize and query blockchain data.
            </p>
          </li>
          <li>
            <h4>Efficient Querying:</h4>
            <p>
              Using GraphQL, you can query only the data you need instead of
              fetching entire blocks or transaction data and manually filtering
              it (which can be inefficient).
            </p>
          </li>
          <li>
            <h4>Real-Time Updates:</h4>
            <p>
              The Graph provides real-time updates by indexing events as they
              are emitted on-chain.
            </p>
            <p>
              This makes it ideal for applications that require up-to-date
              information, such as DeFi dashboards or NFT marketplaces.
            </p>
          </li>
          <li>
            <h4>Cost Efficiency:</h4>
            <p>
              Fetching data through The Graph is often cheaper than making
              repeated calls to a blockchain node or Etherscan's API, especially
              when dealing with historical data or complex queries.
            </p>
          </li>
          <li>
            <h4>Decentralized and Open:</h4>
            <p>
              The Graph is a decentralized protocol where anyone can deploy
              subgraphs and query data, promoting transparency and
              accessibility.
            </p>
          </li>
          <li>
            <h4>Better Developer Experience:</h4>
            <p>
              The Graph's ecosystem has tools to help you easily deploy and
              query subgraphs.
            </p>
            <p>
              It abstracts away much of the complexity of parsing raw blockchain
              data, such as decoding logs and transactions.
            </p>
          </li>
        </ul>
      </div>
      {/* Button to trigger data fetch */}
      <button className="action-button" onClick={fetchData}>
        Fetch Transfers
      </button>

      {/* Display loading message */}
      {loading && <p>Loading...</p>}

      {/* Display error message */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display the fetched transfers */}
      {transfers.length > 0 && (
        <div>
          <h3>Latest Transfers:</h3>

          {transfers.map((transfer) => (
            <div key={transfer.id}>
              <strong>To:</strong> {transfer.to} <br />
              <strong>ID:</strong> {transfer.id}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TheGraph;
