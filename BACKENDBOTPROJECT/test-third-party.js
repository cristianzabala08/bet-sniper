/**
 * Test script for Third-Party Signal Integration
 * Requirements: npm install socket.io-client axios
 */
const { io } = require("socket.io-client");
const axios = require("axios");

const API_KEY = "EmpresaExterna123";
const HTTP_BASE_URL = "http://localhost:3001";
const WS_BASE_URL = "http://localhost:3001/external-signals";

async function runTests() {
  console.log("--- STARTING THIRD-PARTY INTEGRATION TESTS ---");

  // 1. Test REST API (Dashboard)
  try {
    console.log("\n[1] Testing REST API: GET /receive...");
    const resp = await axios.get(`${HTTP_BASE_URL}/third-party/signals/receive`, {
      headers: { "x-api-key": API_KEY }
    });
    console.log("SUCCESS: Received dashboard data.");
    console.log(`- Wins: ${resp.data.barraSuperior.wins}`);
    console.log(`- Losses: ${resp.data.barraSuperior.losses}`);
  } catch (err) {
    console.warn("FAILED: REST API check (is the server running locally on 3001?)", err.message);
  }

  // 2. Test WebSocket
  console.log("\n[2] Testing WebSocket Connection...");
  const socket = io(WS_BASE_URL, {
    auth: { apiKey: API_KEY }
  });

  socket.on("connect", () => {
    console.log("SUCCESS: Connected to WebSocket /external-signals namespace!");
    console.log("Waiting 5 seconds for any updates before closing...");
  });

  socket.on("dashboardUpdate", (data) => {
    console.log("EVENT RECEIVED: dashboardUpdate");
    console.log(data);
  });

  socket.on("connect_error", (err) => {
    console.warn("FAILED: WebSocket connection error:", err.message);
    process.exit(1);
  });

  setTimeout(() => {
    console.log("\nClosing tests...");
    socket.disconnect();
    process.exit(0);
  }, 6000);
}

runTests();
