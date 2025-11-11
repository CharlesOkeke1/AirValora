// Home.jsx
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import background from '../assets/Homepagebg.png';
import gtaMap from '../assets/gta-map.png';
import planeIcon from '../assets/plane-Icon.png';
import '../components/Home.css';
import { auth, db } from '../firebase/firebaseConfig';

import { filterLiveFlightsForList } from '../utils/filterLiveFlights';
import { filterLiveFlightsForMap } from '../utils/filterLiveFlightsForMap';
import { getFlightStatus } from '../utils/getFlightStatus';
import { moveLandedFlights } from '../utils/moveLandedFlightsToPast';


function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [flights, setFlights] = useState([]);
  const [activeFlights, setActiveFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showHangarModal, setShowHangarModal] = useState(false);


  

  const airportCoords = {
    LSA: { x: 34, y: 89 },
    CAS: { x: 63, y: 66.5 },
    SAN: { x: 60.5, y: 43.2 },
    MCK: { x: 68, y: 25 },
    FCD: { x: 27, y: 39 }
  };

  const FLIGHT_PATHS = {
    "LSA-CAS": {
      points: "28,92 35,95 47,95 52,85 50,77.5 60,65", // Primary runway alignment
      stroke: "purple"
    },
    "LSA-SAN": {
      points: "28.5,90 38,78 36,47 62,40.5", // Primary runway alignment
      stroke: "lightblue"
    },
    "SAN-LSA": {
      points: "62,39.8 32,46.6 16,60 12,75 11.5,83.5 34,92.5", // Alternative flight path (current)
      stroke: "white"
    },
    "SAN-FCD": {
      points: "62,40.5 45,45 35,42 27,39", // Primary runway alignment
      stroke: "pink"
    },
    "FCD-MCK": {
      points: "24.5,42 39,43 47,36 55,33 60,30 61.5,30 69,26.5", // Primary runway alignment
      stroke: "orange"
    },
    "MCK-FCD": {
      points: "69,26.5 60,30 55,33 47,36 39,42 27,41", // Primary flight path
      stroke: "pink"
    },
    "FCD-LSA": {
      points: "27,42 18,39.5 12,45 10,60 12,75 11,84.5 34,94", // Primary runway alignment
      stroke: "red"
    },
    "FCD-SAN": {
      points: "27,39 33,41 45,42 55,42 62,40.6", // Primary runway alignment
      stroke: "brown"
    },
    "SAN-MCK": {
      points: "61.5,41.5 55,47 47,46 40,43 37,35 40,32 53,30 60,29 69,26.5", // Short-takeOff runway alignment
      stroke: "purple"
    },
    "LSA-MCK (E)": {
      points: "28,92 35,95 47,95 60,90 86,87 78,52 70.5,24 55,14 29,28 20,40 27,42 40,40 45,35 69,26.5", // Primary runway alignment
      stroke: "yellow"
    },
    "LSA-MCK (W)": {
      points: "34,93.5 11,84 12,75 14,60 20,45 40,40 45,35 69,26.5", //  Primary runway alignment
      stroke: "green"
    },
    "CAS-FCD": {
      points: "50,77.5 60,65 53,48 39,42 27,41", // Currently under construction🚧
      stroke: "green"
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();

        if (!userData?.fcdAccess) {
          setShowHangarModal(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'flights'));
        const flightsData = snapshot.docs
          .map(docSnap => {
            const data = docSnap.data();
            return {
              ...data,
              id: docSnap.id,
              progress: data.progress || 0,
              duration: (data.durationMins || 1) * 60,
              landed: data.landed || false
            };
          })
          .filter(f => !f.landed);

        const notLanded = flightsData;
        const visibleFlights = filterLiveFlightsForList(notLanded);
        const airborneFlights = filterLiveFlightsForMap(notLanded);
        setFlights(visibleFlights);
        setActiveFlights(airborneFlights);
      } catch (error) {
        console.error('Error fetching flights:', error);
      }
    };
    fetchFlights();
  }, []);



  useEffect(() => {
    moveLandedFlights(); // run immediately on mount
    const interval = setInterval(moveLandedFlights, 60 * 1000); // every 60s
    return () => clearInterval(interval);
  }, []);


    useEffect(() => {
      const interval = setInterval(() => {
        setActiveFlights(prev =>
          prev.flatMap(f => {
            if (f.progress >= 1 && !f.landed) {
              setTimeout(() => {
                setActiveFlights(curr => curr.filter(ff => ff.flightCode !== f.flightCode));
              }, 10000);
            updateDoc(doc(db, 'flights', f.id), {
              landed: true,
              progress: 1,
              // only set landedAt once
              landedAt: f.landedAt || new Date().toISOString(),
            });
              return [{ ...f, landed: true }];
            }

            if (f.landed) return [f];

            const now = new Date();
            const dep = typeof f.departureTimestamp === 'string'
              ? new Date(f.departureTimestamp)
              : f.departureTimestamp?.toDate?.() || new Date();
            const delay = f.delayMins || 0;
            const durationMs = (f.durationMins || 1) * 60 * 1000;

            dep.setMinutes(dep.getMinutes() + delay);
            const elapsed = now - dep;
            const newProgress = Math.min(Math.max(elapsed / durationMs, 0), 1);

            // write progress every tick
            updateDoc(doc(db, 'flights', f.id), { progress: newProgress });

            // if we've actually passed arrival, mark landed & landedAt
            const arrival = new Date(dep.getTime() + durationMs);
            if (now >= arrival && !f.landed) {
              updateDoc(doc(db, 'flights', f.id), {
                landed: true,
                landedAt: f.landedAt || now.toISOString(),
              });
              return [{ ...f, progress: 1, landed: true, landedAt: f.landedAt || now.toISOString() }];
            }

            return [{ ...f, progress: newProgress }];
          })
        );

      }, 1000);
      return () => clearInterval(interval);
    }, []);

  const airports = Object.entries(airportCoords).map(([code, coords]) => ({
    code,
    name: code,
    x: `${coords.x}%`,
    y: `${coords.y}%`
  }));

  const knownAirports = ["LSA", "CAS", "SAN", "MCK", "FCD"];
  const fromOptions = [...new Set(flights.map(r => r.from))];
  const toOptions = [...new Set(flights.map(r => r.to))];

  // fallback to known list if no flights loaded
  const fromList = fromOptions.length ? fromOptions : knownAirports;
  const toList = toOptions.length ? toOptions : knownAirports;


  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [passengers, setPassengers] = useState('1 Passenger Economy');

  const handleSearch = () => {
    if (!from || !to || !departDate) {
      alert("Please select a From, To, and Date.");
      return;
    }

    navigate('/results', {
      state: {
        from,
        to,
        date: departDate
      }
    });
  };


  const handleAuthClick = () => {
    navigate(user ? '/dashboard' : '/signin');
  };

  const handleAttemptBooking = async (flight) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert('Please log in to book a flight.');
      return;
    }

    // Check if the flight is to/from FCD
    const involvesFCD = flight.route.includes('FCD');

    if (involvesFCD) {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (!userData?.fcdAccess) {
        setShowHangarModal(true); // Show modal and exit
        return;
      }
    }

    // ✅ Continue with booking if passed
    proceedWithBooking(flight);
  };


  return (
    <div className="homepage">
      <div className="hero-section" style={{ backgroundImage: `url(${background})` }}>
        <nav className="navbar">
          <div className="logo">AIR VALORA</div>
          <ul className="nav-links">
            <li onClick={() => navigate('/book')}>Book</li>
            <li>Help</li>
            <li onClick={() => navigate('/join-crew')}>Join Us</li>
            <li className="lang">EN</li>
            <li onClick={handleAuthClick} style={{ fontWeight: 'bold' }}>
              {user ? 'Dashboard' : 'Login | Signup'}
            </li>
          </ul>
        </nav>

        <div className="hero-overlay">
          <h1>Unlock your passion for exploration</h1>
          <p>Enjoy great savings with Air Valora</p>
          <button className="book-now" onClick={() => navigate('/book')}>Book now</button>
        </div>
      </div>

      

      <div className="main-section">
        {showHangarModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h3>FCD Hangar Required</h3>
              <p>You must own a hangar at Fort Zancudo (FCD) to fly to or from this location.</p>
              <button
                onClick={async () => {
                  await setDoc(doc(db, 'users', auth.currentUser.uid), {
                    fcdAccess: true
                  }, { merge: true });

                  setShowHangarModal(false);
                  alert('✅ Hangar access saved. You can now book FCD flights.');
                }}
              >
                I Own a Hangar at FCD
              </button>

              <button onClick={() => setShowHangarModal(false)}>Cancel</button>
            </div>
          </div>
        )}


        <div className="search-panel">
          <div className="search-options">
            <label><input type="radio" name="trip" defaultChecked /> Return</label>
            <label><input type="radio" name="trip" /> One way</label>
            <label><input type="radio" name="trip" /> Multi-city</label>
          </div>

          <div className="search-fields">
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              <option value="">From</option>
              {fromList.map(loc => <option key={loc}>{loc}</option>)}
            </select>
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">To</option>
              {toList.map(loc => <option key={loc}>{loc}</option>)}
            </select>
            <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
            <select value={passengers} onChange={(e) => setPassengers(e.target.value)}>
              <option>Economy Class</option>
              <option>Business Class</option>
            </select>
          </div>

          <div className="search-actions">
            <label><input type="checkbox" /> Book using Miles</label>
            <button className="search-btn" onClick={handleSearch}>Search flights</button>
          </div>
        </div>

        <div className="flight-status-board">
          <h3
            onClick={() => navigate('/daily-flights')}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
              color: '#8e44ad',
              fontWeight: '600',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#5e3370')}
            onMouseLeave={(e) => (e.target.style.color = '#8e44ad')}
          >
            Live Flight Status
          </h3>

          <div className="status-table">
            {flights.map((flight, idx) => {
              const dep = flight.departureTimestamp?.toDate?.() || new Date(flight.departureTimestamp);
              const delayMins = flight.delayMins || 0;
              const depTime = dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              // Apply delay to get updated time
              const delayedDep = new Date(dep.getTime() + delayMins * 60000);
              const updatedTime = delayedDep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              const { status, color } = getFlightStatus(flight);

              return (
                <div key={idx} className="status-row" onClick={() => navigate('/daily-flights')}>
                  <span className="flight-code">
                    {flight.flightCode}
                    <p>
                      <strong>Departure:</strong> {depTime}
                      {delayMins > 0 && (
                        <> → <span style={{ color: 'red' }}>{updatedTime} (Delayed)</span></>
                      )}
                    </p>
                  </span>
                  <span className="flight-route">{flight.route}</span>
                  <span style={{ color }}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gta-map-container">
          <img src={gtaMap} alt="GTA Map" className="gta-map-image" />

          {airports.map((airport) => (
            <div
              key={airport.code}
              className="airport-marker"
              style={{ top: airport.y, left: airport.x }}
              title={airport.name}
            >
              ✈ {airport.code}
            </div>
          ))}

          {activeFlights.map((flight, index) => {
            const normalize = (code) => code.replace(/\s*\(.*?\)/g, '').trim(); // strips (E)/(W), trims whitespace
              const { status } = getFlightStatus(flight);
              if (status === "Cancelled") return null;


            const fromCode = normalize(flight.from);
            const toCode = normalize(flight.to);
            const fromCoord = airportCoords[fromCode];
            const toCoord = airportCoords[toCode];

            const pathKey = `${flight.from}-${flight.to}`; // keep full key for route match
            const path = FLIGHT_PATHS[pathKey];
  
            if (!path || !fromCoord || !toCoord) return null;
            if (!path) return null;

            const points = path.points.split(' ').map(p => {
              const [x, y] = p.split(',').map(parseFloat);
              return { x, y };
            });

            const segCount = points.length - 1;
            const progress = Math.max(0, Math.min(flight.progress || 0, 1));
            const segIndex = Math.min(Math.floor(progress * segCount), segCount - 1);
            const segProgress = (progress * segCount) - segIndex;

            const start = points[segIndex];
            const end = points[segIndex + 1];

            const x = start.x + (end.x - start.x) * segProgress;
            const y = start.y + (end.y - start.y) * segProgress;
            const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) + 90;

            const departure = flight.departureTimestamp?.toDate?.() || new Date(flight.departureTimestamp);
            const delay = flight.delayMins || 0;
            departure.setMinutes(departure.getMinutes() + delay);

            const duration = flight.durationMins || 1;
            const arrival = new Date(departure.getTime() + duration * 60000);
            const eta = arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <React.Fragment key={index}>
                {!flight.landed && (
                  <>
                    <svg className="dynamic-flight-path" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polyline
                        points={path.points}
                        stroke={path.stroke}
                        strokeWidth="0.5"
                        fill="none"
                      />
                    </svg>

                    <img
                      src={planeIcon}
                      alt="✈️"
                      className="plane-icon"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: `translate(-50%, -50%) rotate(${angle}deg)`
                      }}
                      onClick={() => setSelectedFlight({ ...flight, eta })}
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}

          {selectedFlight && (() => {
            const normalize = (code) => code.replace(/\s*\(.*?\)/g, '').trim();
            const { status, color } = getFlightStatus(selectedFlight);
            const delayMins = selectedFlight.delayMins || 0;
            const fromCode = normalize(selectedFlight.from);
            const toCode = normalize(selectedFlight.to);
            const fromCoord = airportCoords[fromCode];
            const toCoord = airportCoords[toCode];
            if (!fromCoord || !toCoord || status === "Cancelled" || selectedFlight.durationMins < 0.5) return null;

            const depTime = selectedFlight.departureTimestamp?.toDate?.() || new Date(selectedFlight.departureTimestamp);
            const delayedDep = new Date(depTime.getTime() + delayMins * 60000);
            const updatedDepTime = delayedDep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const arrival = new Date(delayedDep.getTime() + (selectedFlight.durationMins || 1) * 60000);
            const arrivalTime = arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            return (
              <div className="flight-summary-popup">
                <div className="popup-content">
                  <h3>Flight {selectedFlight.flightCode}</h3>
                  <p><strong>Route:</strong> {selectedFlight.from} → {selectedFlight.to}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span style={{ color }}>
                      {status}
                      {status === "Delayed" && delayMins > 0 && ` by ${delayMins} mins`}
                    </span>
                  </p>

                  {status === "Cancelled" && (
                    <p style={{ color: "red", fontWeight: "bold" }}>❌ This flight has been cancelled.</p>
                  )}

                  <p><strong>Aircraft:</strong> {selectedFlight.aircraft}</p>
                  <p><strong>Departure:</strong> {updatedDepTime}</p>
                  <p><strong>Arrival:</strong> {arrivalTime}</p>
                  <p><strong>ETA:</strong> {selectedFlight.eta}</p>

                  <button onClick={() => setSelectedFlight(null)}>Close</button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default Home;
