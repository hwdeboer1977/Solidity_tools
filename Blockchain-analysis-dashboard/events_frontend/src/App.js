import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

function App() {
  const [events, setEvents] = useState([]);
  const [blockVolumes, setBlockVolumes] = useState([]);
  const [baseFees, setBaseFees] = useState([]);
  const [gasRatios, setGasRatios] = useState([]);

  // Function to fetch events from the backend: initial situation
  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:4000/events");
      const data = await response.json();
      console.log("Fetched events:", data); // Add this line
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Function to fetch events from the backend: volume of USDT transactions per block
  const fetchBlockVolumes = async () => {
    try {
      const response = await axios.get("http://localhost:4000/block-volumes");
      setBlockVolumes(response.data);
    } catch (error) {
      console.error("Error fetching block volumes:", error);
    }
  };

  // Function to fetch events from the backend: volume of USDT transactions per block
  const fetchBaseFees = async () => {
    try {
      const response = await axios.get("http://localhost:4000/block-metrics");
      setBaseFees(response.data.baseFees);
      setGasRatios(response.data.gasRatios);
    } catch (error) {
      console.error("Error fetching block volumes:", error);
    }
  };

  // Fetch events every 15 seconds
  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    fetchBlockVolumes();
    const interval = setInterval(fetchBlockVolumes, 15000); // Fetch every 15 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Fetch data every 15 seconds
  useEffect(() => {
    fetchBaseFees();
    const interval = setInterval(fetchBaseFees, 15000); // Fetch every 15 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Chart data for BASEFEE
  const baseFeeChartData = {
    labels: baseFees.map((block) => block.blockNumber),
    datasets: [
      {
        label: "BASEFEE per Block (Gwei)",
        data: baseFees.map((block) => block.baseFee),
        backgroundColor: "rgba(0, 123, 255, 0.6)", // Use a semi-transparent color for the bars
        borderColor: "rgba(0, 123, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart data for Gas Ratio
  const gasRatioChartData = {
    labels: gasRatios.map((block) => block.blockNumber),
    datasets: [
      {
        label: "Gas Ratio (gasUsed / gasLimit)",
        data: gasRatios.map((block) => block.gasRatio),
        backgroundColor: "rgba(0, 123, 255, 0.6)", // Use a semi-transparent color for the bars
        borderColor: "rgba(0, 123, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Data for the chart
  const chartDataVolume = {
    labels: blockVolumes.map((block) => block.blockNumber),
    datasets: [
      {
        label: "Total Transfer Volume per Block (USDT)",
        data: blockVolumes.map((block) => block.volume),
        backgroundColor: "rgba(0, 123, 255, 0.6)", // Use a semi-transparent color for the bars
        borderColor: "rgba(0, 123, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  // set specific dimensions for your charts using the options object
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allows custom height and width
  };

  return (
    <div className="App">
      {/*
      <h2>Latest Transfer Events</h2>
      <div>
        {events.map((event, index) => (
          <div key={index}>
            <p>
              <strong>Block:</strong> {event.blockNumber}
            </p>
            <p>
              <strong>From:</strong> {event.from}
            </p>
            <p>
              <strong>To:</strong> {event.to}
            </p>
            <p>
              <strong>Value:</strong> {event.value}
            </p>
            <hr />
          </div>
        ))}
      </div>
      */}

      <h2>Real-Time Transfer Volume by Block</h2>
      <div style={{ width: "1000px", height: "400px" }}>
        <Bar data={chartDataVolume} options={options} />
      </div>

      <h2>Real-Time BaseFees per Block</h2>
      <div style={{ width: "1000px", height: "400px" }}>
        <Bar data={baseFeeChartData} options={options} />
      </div>

      <h2>Real-Time gasUsed ratio per Block</h2>
      <div style={{ width: "1000px", height: "400px" }}>
        <Bar data={gasRatioChartData} options={options} />
      </div>
    </div>
  );
}

export default App;
