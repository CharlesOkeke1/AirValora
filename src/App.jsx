// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Booking from './pages/Booking';
import FlightResults from './pages/FlightResults';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import ConfirmBooking from './pages/ConfirmBooking';
import JoinCrew from './pages/JoinCrew';
import DailyFlights from './pages/DailyFlights';
import PilotControlPanel from './pages/PilotControlPanel';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/book" element={<Booking />} />
      <Route path="/results" element={<FlightResults />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/confirm-booking" element={<ConfirmBooking />} />
      <Route path="/join-crew" element={<JoinCrew />} />
      <Route path="/daily-flights" element={<DailyFlights />} />
      <Route path="/pilot-control" element={<PilotControlPanel />} />
    </Routes>
  );
}

export default App;
