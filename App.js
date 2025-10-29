import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000"); // backend URL

function App() {
  const [alerts, setAlerts] = useState([]);

  // Fetch existing alerts on load
  useEffect(() => {
    fetch("http://localhost:4000/api/alerts")
      .then((res) => res.json())
      .then((data) => setAlerts(data));
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    socket.on("event:new", (evt) => {
      setAlerts((prev) => [evt, ...prev]);
    });

    socket.on("event:update", (evt) => {
      setAlerts((prev) =>
        prev.map((a) => (a.event_id === evt.event_id ? evt : a))
      );
    });

    return () => {
      socket.off("event:new");
      socket.off("event:update");
    };
  }, []);

  // Function to acknowledge alert
  const acknowledgeAlert = async (id) => {
    await fetch(`http://localhost:4000/api/alerts/${id}/ack`, { method: "POST" });
  };

  // Function to dispatch alert
  const dispatchAlert = async (id) => {
    await fetch(`http://localhost:4000/api/alerts/${id}/dispatch`, { method: "POST" });
  };

  // Helper to get status color
  const statusColor = (status) => {
    switch (status) {
      case "new":
        return "#ff4d4f"; // red
      case "acknowledged":
        return "#52c41a"; // green
      case "dispatched":
        return "#1890ff"; // blue
      default:
        return "#000"; // black
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Crowd Dashboard</h1>
      {alerts.length === 0 && <p>No alerts yet.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {alerts.map((alert) => (
          <li
            key={alert.event_id}
            style={{
              border: `2px solid ${statusColor(alert.status)}`,
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <strong>{alert.module.toUpperCase()}</strong> - {alert.camera_label} <br />
            <span>{alert.message}</span> <br />
            <em style={{ color: statusColor(alert.status), fontWeight: "bold" }}>
              {alert.status.toUpperCase()}
            </em>
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={() => acknowledgeAlert(alert.event_id)}
                disabled={alert.status !== "new"}
                style={{
                  marginRight: "10px",
                  padding: "5px 10px",
                  cursor: alert.status !== "new" ? "not-allowed" : "pointer",
                }}
              >
                Acknowledge
              </button>
              <button
                onClick={() => dispatchAlert(alert.event_id)}
                disabled={alert.status === "dispatched"}
                style={{
                  padding: "5px 10px",
                  cursor: alert.status === "dispatched" ? "not-allowed" : "pointer",
                }}
              >
                Dispatch
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
