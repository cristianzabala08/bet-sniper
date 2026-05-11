# Third-Party Signal Integration Guide

This document explains how to integrate with the Baccarat signals system as an external partner.

## 1. Authentication
All requests must be authenticated using your assigned **API Key**.

*   **API Key**: `EmpresaExterna123` (Request a production key if needed)
*   **Method A (Header)**: Include `x-api-key: YOUR_API_KEY` in your HTTP headers.
*   **Method B (Query Param)**: Append `?apiKey=YOUR_API_KEY` to the URL.
*   **Method C (Authorization Header)**: `Authorization: Api-Key YOUR_API_KEY`.

---

## 2. WebSocket Real-Time Stream (Recommended)
Connect to our WebSocket server to receive signals instantly as they are generated.

*   **URL**: `wss://services.betsniper.com/external-signals`
*   **Auth**: Pass the `apiKey` in the `auth` object during connection.

### Implementation Example (Node.js)
```javascript
const { io } = require("socket.io-client");

const socket = io("wss://services.betsniper.com/external-signals", {
  auth: {
    apiKey: "EmpresaExterna123"
  }
});

socket.on("connect", () => {
  console.log("Connected to Signal Stream!");
});

socket.on("dashboardUpdate", (data) => {
  console.log("New Signal Update Received:", data);
});
```

---

## 3. REST API Endpoints
If you prefer polling or need history, you can use our HTTP endpoints.

### 3.1 Get Latest Signals
Returns current statistics (wins/losses) and the most recent active signal.
*   **Endpoint**: `GET /third-party/signals/receive`
*   **Auth**: Required (`x-api-key`).

### 3.2 Get Daily History
Returns a list of all signals and results processed during the current day.
*   **Endpoint**: `GET /third-party/signals/daily`
*   **Auth**: Required (`x-api-key`).

---

## 4. Data Formats

### NEW_SIGNAL Event
Sent when a new betting recommendation is generated.
```json
{
  "type": "NEW_SIGNAL",
  "data": {
    "mesa": "Baccarat A",
    "tipo": "SIGNAL",
    "ronda": "123",
    "data": {
      "signal": {
        "recomendacion": "PLAYER",
        "martingala": 1
      }
    }
  }
}
```

### NEW_RESULT Event
Sent when a round finishes and the result (Win/Loss) is determined.
```json
{
  "type": "NEW_RESULT",
  "winStatus": true,
  "data": {
    "mesa": "Baccarat A",
    "tipo": "RESULT",
    "win": true
  }
}
```
