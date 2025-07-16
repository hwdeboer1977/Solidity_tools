import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Defender from "./components/Defender";
import Chainlink from "./components/Chainlink";
import TheGraph from "./components/TheGraph";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <h1>Blockchain Projects</h1>
        <h4>
          Click links below for (1) OpenZeppelin Defender, (2) Chainlink Keeper,
          (3) The Graph Protocol:
        </h4>
        <nav>
          <ul>
            <li>
              <Link to="/defender">OpenZeppelin Defender</Link>
            </li>
            <li>
              <Link to="/chainlink">Chainlink Keeper</Link>
            </li>
            <li>
              <Link to="/the-graph">The Graph Protocol</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/defender" element={<Defender />} />
          <Route path="/chainlink" element={<Chainlink />} />
          <Route path="/the-graph" element={<TheGraph />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
