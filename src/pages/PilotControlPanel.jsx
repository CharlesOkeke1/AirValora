import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import "../components/Home.css";

const PilotControlPanel = () => {
  const [flights, setFlights] = useState([]);
  const [delays, setDelays] = useState({});
  const [statusMessage, setStatusMessage] = useState("");

  const uid = auth.currentUser?.uid;
  const now = new Date();

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const snapshot = await getDocs(collection(db, "flights"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFlights(data);
      } catch (err) {
        console.error("Failed to load flights:", err);
      }
    };

    fetchFlights();
  }, []);

  const cancelFlight = async (flightId) => {
    try {
      await updateDoc(doc(db, "flights", flightId), {
        statusOverride: "Cancelled",
      });
      setStatusMessage(`❌ Flight ${flightId} cancelled.`);
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to cancel flight.");
    }
  };

  const applyDelay = async (flightId) => {
    const delay = Number(delays[flightId]) || 0;
    try {
      await updateDoc(doc(db, "flights", flightId), {
        delayMins: delay,
        statusOverride: "Delayed",
      });
      setStatusMessage(`⏱️ Flight ${flightId} delayed by ${delay} mins.`);
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to delay flight.");
    }
  };

  const eligibleFlights = flights.filter((flight) => {
    if (!flight.assignedPilotUid || flight.assignedPilotUid !== uid) return false;

    const dep = typeof flight.departureTimestamp?.toDate === "function"
      ? flight.departureTimestamp.toDate()
      : new Date(flight.departureTimestamp);

    if (isNaN(dep.getTime())) return false;

    const delay = flight.delayMins || 0;
    dep.setMinutes(dep.getMinutes() + delay);

    const thirtyMinsBeforeDep = new Date(dep.getTime() - 30 * 60000);
    const takeoffStart = new Date(dep.getTime() - 15 * 1000);

    return now >= thirtyMinsBeforeDep && now < takeoffStart;
  });

  const formatTime = (dateInput) => {
    const date = typeof dateInput?.toDate === "function"
      ? dateInput.toDate()
      : new Date(dateInput);
    return isNaN(date.getTime())
      ? "--"
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="pilot-panel-container">
      <h2>🛫 Pilot Control Panel</h2>
      {statusMessage && <p className="status-msg">{statusMessage}</p>}
      <div className="flight-list">
        {eligibleFlights.map((flight) => (
          <div key={flight.id} className="flight-control-box">
            <h4>{flight.flightCode}</h4>
            <p>{flight.route}</p>
            <p><strong>Departure:</strong> {formatTime(flight.departureTimestamp)}</p>
            <div className="controls">
              <input
                type="number"
                placeholder="Delay mins"
                value={delays[flight.id] || ""}
                onChange={(e) =>
                  setDelays({ ...delays, [flight.id]: e.target.value })
                }
              />
              <button onClick={() => applyDelay(flight.id)}>Delay</button>
              <button
                onClick={() => cancelFlight(flight.id)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PilotControlPanel;
