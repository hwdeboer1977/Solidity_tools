// import axios from "axios";

// // utils/DefenderAPI.js
// export const fetchSwapEvents = async (contractAddress, event) => {
//   try {
//     // Adjust the URL to match your backend server's endpoint
//     const response = await fetch("http://localhost:5000/api/defender-event", {
//       method: "POST", // Change to POST request
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contractAddress, // Send the contract address in the request body
//         event, // Send the event in the request body
//       }),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to fetch swap events");
//     }

//     const data = await response.json();
//     return data.events; // Assuming your server sends events in the 'events' field
//   } catch (error) {
//     console.error("Error fetching events:", error);
//     return []; // Return empty array on error
//   }
// };
