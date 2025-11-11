// src/pages/FlightResults.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import aircraftLayouts from '../data/aircraftLayouts';
import '../components/Home.css';

function FlightResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  const { from = 'LSA', to = 'CAS', date = '' } = location.state || {};

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFlight, setExpandedFlight] = useState(null);
  const [error, setError] = useState('');
  const [userAccess, setUserAccess] = useState({ fcdAccess: false });

  useEffect(() => {
    const fetchUserAccess = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const data = userDoc.data() || {};
      setUserAccess(data);
      console.log('👤 userAccess:', data);
    };

    fetchUserAccess();
  }, []);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'flights'));
        const allFlights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const routeExists = allFlights.some(f => f.from === from && f.to === to);
        if (!routeExists) {
          setError('No flight found for the selected route.');
          return;
        }

        const matchingDateFlights = allFlights.filter(
          f => f.from === from && f.to === to && f.date === date
        );

        if (matchingDateFlights.length === 0) {
          setError('No flight available on this date.');
          return;
        }

        const now = new Date();

        const validFlights = matchingDateFlights.filter(flight => {
          if (flight.landed) return false;

          // Parse departureTime into full date
          const depTimeParts = flight.departureTime.split(':'); // ["HH", "MM"]
          const depDateTime = new Date(`${flight.date}T${depTimeParts[0].padStart(2, '0')}:${depTimeParts[1].padStart(2, '0')}:00`);

          const minutesUntilDeparture = (depDateTime - now) / (1000 * 60);

          return minutesUntilDeparture > 20;
        });

        if (validFlights.length === 0) {
          setError('No upcoming flights available. Booking closes 20 minutes before departure.');
          return;
        }

        setFlights(validFlights);
      } catch (err) {
        console.error('Error fetching flights:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [from, to, date]);


  const handleSelectFlight = (flight) => {
    console.log("✅ handleSelectFlight called:", flight.flightCode);
    setExpandedFlight(flight);
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const renderSeatMap = (aircraft, takenSeats = []) => {
    const layout = aircraftLayouts[aircraft];
    if (!layout) return <p>Seat map not available.</p>;

    return (
      <div className="seat-map">
        {layout.layout.map((row, i) => (
          <div key={i} className="seat-row">
            {row.map((seat) => {
              const isTaken = (takenSeats || []).includes(seat);
              return (
                <div
                  key={seat}
                  className={`seat ${isTaken ? 'taken' : ''}`}
                  title={seat}
                >
                  {seat}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const calculateSeatsLeft = (flight) => {
    const totalSeats = flight.seatsLeft || aircraftLayouts[flight.aircraft]?.totalSeats || 0;
    const taken = flight.takenSeats?.length || 0;
    return totalSeats - taken;
  };

  return (
    <div className="results-page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      <h2>Select Your Flight</h2>
      <p>{from} → {to}</p>

      {loading ? (
        <div className="loading">Loading flights...</div>
      ) : error ? (
        <div className="no-results">{error}</div>
      ) : flights.length === 0 ? (
        <div className="no-results">No flights found for this route.</div>
      ) : (
        <div className="results-list">
          {flights.map((flight) => {
            const seatsLeft = calculateSeatsLeft(flight);
            const isFull = seatsLeft <= 0;
            const isFCD = flight.from === 'FCD' || flight.to === 'FCD';
            const isBlocked = isFCD && !userAccess.fcdAccess;

            return (
              <div className={`flight-card ${isFull ? 'disabled' : ''}`} key={flight.id}>
                <h3>{flight.flightCode}</h3>
                <p><strong>Date:</strong> {flight.date}</p>
                <p><strong>Aircraft:</strong> {flight.aircraft}</p>
                <p><strong>Departs:</strong> {flight.departureTime}</p>
                <p><strong>Arrives:</strong> {flight.arrivalTime}</p>
                <p><strong>Price:</strong> {flight.price}</p>
                <p className="seats-left">{isFull ? 'Flight is Full' : `${seatsLeft} seats left`}</p>
                <button
                  className="book-btn"
                  disabled={isFull}
                  onClick={() => {
                    console.log("🛫 Clicked flight:", flight.flightCode);
                    console.log("🚫 isFCD:", isFCD);
                    console.log("🔐 userAccess.fcdAccess:", userAccess.fcdAccess);
                    console.log("❌ isBlocked:", isBlocked);

                    if (isBlocked) {
                      alert('You need FCD hangar access to book this flight.');
                      return;
                    }

                    handleSelectFlight(flight);
                  }}
                >
                  {isBlocked ? 'FCD Access Required' : 'View Details'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {expandedFlight && (() => {
        const seatsLeft = calculateSeatsLeft(expandedFlight);
        const isBlocked = 
          (expandedFlight.from === 'FCD' || expandedFlight.to === 'FCD') && !userAccess.fcdAccess;

        return (
          <div ref={sectionRef} className="flight-details">
            <div className="flight-info-box">
              <h3>Flight Info</h3>
              <p><strong>Flight Code:</strong> {expandedFlight.flightCode}</p>
              <p><strong>Route:</strong> {expandedFlight.from} → {expandedFlight.to}</p>
              <p><strong>Date:</strong> {expandedFlight.date}</p>
              <p><strong>Gate:</strong> {expandedFlight.gate}</p>
              <p><strong>Class:</strong> {expandedFlight.class}</p>
              <p><strong>Aircraft:</strong> {expandedFlight.aircraft}</p>
              <p><strong>Seats Left:</strong> {seatsLeft}</p>
              <button
                className="generate-btn"
                onClick={() => {
                  if (isBlocked) {
                    alert('This flight requires hangar access at FCD.');
                    return;
                  }
                  navigate('/confirm-booking', { state: expandedFlight });
                }}
                disabled={seatsLeft <= 0 || isBlocked}
              >
                {isBlocked ? 'Access Denied' : 'Continue'}
              </button>
            </div>

            <div className="seat-map-box">
              <h4>Seat Map (Read-only)</h4>
              {renderSeatMap(expandedFlight.aircraft, expandedFlight.takenSeats)}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default FlightResults;
