// backend/server.js
const express = require("express");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const socketIo = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const alerts = new Map(); // In-memory storage

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// ✅ 1. Receive events from detection modules
app.post("/api/events", (req, res) => {
  const evt = req.body;
  evt.event_id = evt.event_id || uuidv4();
  evt.received_at = new Date().toISOString();
  evt.status = "new";

  alerts.set(evt.event_id, evt);
  io.emit("event:new", evt); // Send to all connected dashboards

  console.log(`⚠️  [${evt.module.toUpperCase()}] Event from ${evt.camera_label}`);
  res.status(201).json({ ok: true, event_id: evt.event_id });
});

// ✅ 2. Acknowledge alert
app.post("/api/alerts/:id/ack", (req, res) => {
  const id = req.params.id;
  const alert = alerts.get(id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  alert.status = "acknowledged";
  alerts.set(id, alert);
  io.emit("event:update", alert);
  res.json({ ok: true });
});

// ✅ 3. Dispatch alert to authorities
app.post("/api/alerts/:id/dispatch", (req, res) => {
  const id = req.params.id;
  const alert = alerts.get(id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  alert.status = "dispatched";
  alerts.set(id, alert);
  io.emit("event:update", alert);

  console.log(`🚨 Dispatch sent for ${alert.module} at ${alert.camera_label}`);
  // For now, just log. Later we can send email/SMS/FCM here.

  res.json({ ok: true });
});

// ✅ 4. Get all alerts (optional)
app.get("/api/alerts", (req, res) => {
  res.json([...alerts.values()]);
});

const PORT = 4000;
server.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
