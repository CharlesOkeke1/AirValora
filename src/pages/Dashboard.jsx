import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import '../components/Home.css';
import { useNavigate, Link } from 'react-router-dom';
import { moveLandedFlights } from '../utils/moveLandedFlightsToPast';
import { signOut } from 'firebase/auth';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [approved, setApproved] = useState(false);
  const [isCrew, setIsCrew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [pastFlights, setPastFlights] = useState([]);
  const navigate = useNavigate();

  const user = auth.currentUser;

  // Run flight mover every 5 minutes
  useEffect(() => {
    moveLandedFlights(); // run immediately on mount
    const interval = setInterval(moveLandedFlights, 60 * 1000); // every 60s
    return () => clearInterval(interval);
  }, []);


  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const bookingsSnap = await getDocs(collection(db, 'users', user.uid, 'bookings'));
          setBookings(bookingsSnap.docs.map(doc => doc.data()));

          const pastFlightsSnap = await getDocs(collection(db, 'users', user.uid, 'pastFlights'));
          setPastFlights(pastFlightsSnap.docs.map(doc => doc.data()));

          const data = userDoc.data();
          setUserData(data);
          setIsCrew(data.isCrew === true);
          setApproved(data.approved === true);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert('🚪 Signed out successfully.');
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('❌ Error signing out. Try again.');
    }
  };

  if (loading) return <div className="dashboard-page">Loading...</div>;

  // Loyalty System – now based on AVMiles
  const currentMiles = userData?.AVMiles || 0;
  const tiers = [
    { name: "Bronze", emoji: "🥉", min: 0 },
    { name: "Silver", emoji: "🥈", min: 3600 },
    { name: "Gold", emoji: "🥇", min: 8000 },
    { name: "Ruby", emoji: "❤️‍🔥", min: 15000 },
    { name: "Diamond", emoji: "💎", min: 20000 },
    { name: "Platinum", emoji: "🛡️", min: 25000 },
  ];

  let currentTier = tiers[0];
  let nextTier = null;

  for (let i = 0; i < tiers.length; i++) {
    if (currentMiles >= tiers[i].min) {
      currentTier = tiers[i];
      nextTier = tiers[i + 1] || null;
    }
  }

  const milesToNext = nextTier ? nextTier.min - currentMiles : 0;
  const progress = nextTier
    ? ((currentMiles - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
        <h2>Welcome, {String(userData?.fullName || "Air Valora User")}</h2>

        {approved && (
          <Link to="/pilot-control" className="pilot-link">
            <div className="pilot-section">
              <h3>👨‍✈️ Crew Dashboard</h3>
              <p><strong>Flights Assigned:</strong> Coming soon</p>
              <p><strong>Recent Flights Flown:</strong> Coming soon</p>
              <p><strong>Pilot Tips:</strong> Remember to check in 10 mins before departure!</p>
            </div>
          </Link>
        )}

        {/* Profile Card */}
        <div className="profile-card">
          <div className="avatar">{String(userData?.initials || "A")}</div>
          <div>
            <p><strong>PSN:</strong> {String(userData?.psn || "N/A")}</p>
            <p><strong>Loyalty Tier:</strong> {currentTier.emoji} {currentTier.name}</p>
          </div>
        </div>

        {/* Miles */}
        <div className="miles-section">
          <p><strong>Total AVMiles:</strong> {currentMiles}</p>
          {nextTier && (
            <>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="next-tier">Only {milesToNext} miles to {nextTier.emoji} {nextTier.name}!</p>
            </>
          )}
        </div>

        {/* Bookings */}
        <div className="flight-summary">
          <h3>Current Flights</h3>
          {bookings.length > 0 ? (
            bookings.map((flight, idx) => {
              if (!flight || typeof flight !== 'object') return null;
              return (
                <div key={idx}>
                  <p><strong>{String(flight.flightReference || "Unknown")}</strong> – {String(flight.from || "?")} to {String(flight.to || "?")}</p>
                  <p>{String(flight.date || "?")}, {String(flight.departureTime || "?")} → {String(flight.arrivalTime || "?")}</p>
                  <p>Seat: {String(flight.seat || "N/A")}, Aircraft: {String(flight.aircraft || "N/A")}</p>
                </div>
              );
            })
          ) : (
            <p>No active bookings yet.</p>
          )}
        </div>

        {/* Past Flights */}
        <div className="flight-summary">
          <h3>Past Flights</h3>
          {pastFlights.length > 0 ? (
            pastFlights.map((flight, idx) => {
              if (!flight || typeof flight !== 'object') return null;
              return (
                <div key={idx}>
                  <p><strong>{String(flight.flightReference || "Unknown")}</strong> – {String(flight.from || "?")} to {String(flight.to || "?")}</p>
                  <p>{String(flight.date || "?")}, {String(flight.departureTime || "?")} → {String(flight.arrivalTime || "?")}</p>
                  <p>Seat: {String(flight.seat || "N/A")}, Aircraft: {String(flight.aircraft || "N/A")}</p>
                </div>
              );
            })
          ) : (
            <p>No past flights yet.</p>
          )}
        </div>

        {/* Crew CTA */}
        {!approved && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            {isCrew ? (
              <button className="cta-btn" disabled style={{ backgroundColor: '#ccc', cursor: 'not-allowed' }}>
                ⏳ Awaiting Decision
              </button>
            ) : (
              <a href="/join-crew" className="cta-btn">✈️ Apply to Join the Crew</a>
            )}
          </div>
        )}

        <button onClick={handleSignOut} className="signout-btn">
          🔓 Sign Out
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
