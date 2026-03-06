/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // WebSocket Server
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");
    
    // Send initial message
    ws.send(JSON.stringify({ type: "connected", message: "Live score feed active" }));

    ws.on("close", () => console.log("Client disconnected"));
  });

  // Simulate live score updates
  setInterval(() => {
    const update = {
      type: "score_update",
      matchId: "1", // Simulating update for the first match
      score: {
        fullTime: {
          home: Math.floor(Math.random() * 3),
          away: Math.floor(Math.random() * 2)
        }
      }
    };
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(update));
      }
    });
  }, 10000); // Update every 10 seconds

  // API Routes
  app.get("/api/matches", async (req, res) => {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({ 
        status: "error", 
        message: "API Key missing. Please add FOOTBALL_DATA_API_KEY to environment variables." 
      });
    }

    try {
      const response = await fetch("https://api.football-data.org/v4/matches", {
        headers: { "X-Auth-Token": apiKey }
      });
      
      if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
      
      const data = await response.json();
      res.json({ status: "success", data: data.matches });
    } catch (error) {
      console.error("Fetch error:", error);
      res.status(500).json({ status: "error", message: "Failed to fetch live matches" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
