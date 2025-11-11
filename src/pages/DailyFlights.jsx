// DailyFlights.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getFlightStatus } from '../utils/getFlightStatus';
import '../components/Home.css';
import { useNavigate } from 'react-router-dom';
import { moveLandedFlights } from '../utils/moveLandedFlightsToPast';
import { filterTodayFlights } from '../utils/filterTodayFlights';


function DailyFlights() {
  const [flights, setFlights] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'flights'));
        const allFlights = snapshot.docs.map(doc => doc.data());

        const today = new Date().toISOString().slice(0, 10);
        const todayFlights = allFlights.filter(flight => {
          const dep = flight.departureTimestamp?.toDate?.().toISOString?.() || flight.departureTimestamp;
          return dep?.startsWith(today);
        });

        const filtered = filterTodayFlights(allFlights);
        setFlights(filtered);
      } catch (err) {
        console.error('Error fetching today’s flights:', err);
      }
    };

    fetchFlights();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      moveLandedFlights();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="daily-flights-container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <h2>Flights for Today</h2>
      {flights.length === 0 ? (
        <p>No flights scheduled for today.</p>
      ) : (
        <div className="daily-flights-list">
          {flights.map((flight, idx) => {
            const { status, color } = getFlightStatus(flight);
            <p style={{ color }}>{status}</p>
            return (
              <div key={idx} className="flight-card">
                <div className="flight-top">
                  <span className="code">{flight.flightCode}:</span>
                  <span className="status">{status}</span>
                </div>
                <div className="flight-info">
                  <span className="route">{flight.route}:</span>
                  <span className="time">
                    {new Date(
                      flight.departureTimestamp?.toDate?.() || flight.departureTimestamp
                    ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DailyFlights;
