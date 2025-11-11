import React, { useState } from 'react';
import '../pages/Booking.css';
import destination1 from '../assets/CAS-dest.jpg';
import destination2 from '../assets/SA-dest.jpg';
import destination3 from '../assets/LS-dest.jpg';
import { useNavigate } from 'react-router-dom';


const FLIGHTS = [
  { code: 'AV915', route: 'LSA → CAS', aircraft: 'SHAMAL' },
  { code: 'AV134', route: 'FCD → SAN', aircraft: 'MILJET' },
  { code: 'AV217', route: 'LSA → SAN', aircraft: 'MILJET' },
  { code: 'AV118', route: 'SAN → FCD', aircraft: 'MILJET' },
  { code: 'AV264', route: 'FCD → LSA', aircraft: 'NIMBUS' },
  { code: 'AV346', route: 'LSA → MCK (W)', aircraft: 'SHAMAL' },
  { code: 'AV378', route: 'LSA → MCK (E)', aircraft: 'MILJET' },
  { code: 'AV225', route: 'SAN → MCK', aircraft: 'NIMBUS' },
  { code: 'AV239', route: 'SAN → LSA', aircraft: 'MILJET' },
  { code: 'AV960', route: 'LSA → MAP1', aircraft: 'MILJET' },
];

function Booking() {
  const [form, setForm] = useState({
    name: '',
    route: '',
    date: '',
    flightClass: 'Economy',
  });


  const [showPass, setShowPass] = useState(false);
  const [invalidRoute, setInvalidRoute] = useState(false);
  const [flightInfo, setFlightInfo] = useState(null);
  const navigate = useNavigate();


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const foundFlight = FLIGHTS.find((f) => f.route === form.route);
    if (foundFlight) {
      setInvalidRoute(false);
      setFlightInfo(foundFlight);
      setShowPass(true);
      navigate('/results', { state: { flight: foundFlight, name: form.name, date: form.date, flightClass: form.flightClass } });
    } else {
      setShowPass(false);
      setInvalidRoute(true);
    }
  };


  return (
    <div className="booking-page">
      {/* FORM */}
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <form onSubmit={handleSubmit} className="booking-form">
        <h1>✈️ Book a Flight</h1>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <select name="flightClass" value={form.flightClass} onChange={handleChange}>
          <option value="">Select Route</option>
          {FLIGHTS.map((flight) => (
            <option key={flight.code} value={flight.route}>
              {flight.route}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />

        <select name="route" value={form.route} onChange={handleChange}>
          <option value="Economy">Economy</option>
          <option value="Business">Business</option>
        </select>

        <button type="submit">Search flights</button>
      </form>

      {/* ERROR */}
      {invalidRoute && (
        <p className="error">This route isn't available. More routes coming soon.</p>
      )}

      {/* DESTINATIONS */}
      <section className="destinations">
        <h2>🌍 Popular Destinations</h2>
        <div className="destination-grid">
          <div className="dest-card">
            <img src={destination1} alt="CAS" />
            <p>Casino</p>
          </div>
          <div className="dest-card">
            <img src={destination2} alt="SAN" />
            <p>Sandy Shores</p>
          </div>
          <div className="dest-card">
            <img src={destination3} alt="LSA" />
            <p>Los Santos</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Booking;
