import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  doc, setDoc, Timestamp, updateDoc, arrayUnion,
  getDoc, getDocs, query, where, collection
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import QRCode from 'react-qr-code';
import '../components/Home.css';
import BoardingPassSVG from '../components/BoardingPassSVG';
import aircraftLayouts from '../data/aircraftLayouts';
import emailjs from '@emailjs/browser';
import { toPng } from 'html-to-image';

const routeDistances = {
  'LSA → CAS': 490, 'FCD → SAN': 305, 'LSA → SAN': 380, 'SAN → FCD': 300,
  'FCD → LSA': 425, 'LSA → MCK (W)': 530, 'LSA → MCK (E)': 665,
  'SAN → MCK': 295, 'SAN → LSA': 350, 'LSA → MAP1': 750,
  'FCD → MCK': 300, 'MCK → FCD': 320, 'CAS → FCD': 500,
};

function ConfirmBooking() {
  const { state: flight } = useLocation();
  const navigate = useNavigate();
  const [seat, setSeat] = useState('');
  const [userInfo, setUserInfo] = useState({ name: '', email: '', AVMiles: 0 });
  const [confirming, setConfirming] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const svgRef = useRef();
  const distance = routeDistances[`${flight.from} → ${flight.to}`] || 0;

  useEffect(() => {
    const assignSeat = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) return;
        const uid = user.uid;

        const userDocSnap = await getDoc(doc(db, 'users', uid));
        const userData = userDocSnap.data();
        const name = userData?.fullName || 'Valora Guest';
        const email = userData?.email || '';
        const AVMiles = userData?.AVMiles || 0;

        const layout = aircraftLayouts[flight.aircraft]?.layout || [];
        const flatSeats = layout.flat();
        const taken = flight.takenSeats || [];
        const availableSeats = flatSeats.filter(seat => !taken.includes(seat));

        if (availableSeats.length === 0) {
          alert('This flight is full.');
          navigate('/');
          return;
        }

        const assignedSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
        setUserInfo({ name, email, AVMiles });
        setSeat(assignedSeat);
      });

      return () => unsubscribe();
    };

    assignSeat();
  }, [flight, navigate]);

  useEffect(() => {
    if (userInfo.name && seat) {
      setDataReady(true);
    }
  }, [userInfo, seat]);

  const handleConfirmBooking = async () => {
    if (!auth.currentUser || !userInfo.name || !seat) {
      alert('Booking error. Missing user or seat data.');
      return;
    }

    const uid = auth.currentUser.uid;
    const bookingId = `${userInfo.name.trim().slice(0, 2).toUpperCase()}${flight.flightReference}`;
    const bookingRef = doc(db, 'users', uid, 'bookings', bookingId);
    const flightRef = doc(db, 'flights', flight.id);

    const existing = await getDocs(
      query(collection(db, 'users', uid, 'bookings'), where('flightReference', '==', flight.flightReference))
    );
    if (!existing.empty) {
      alert('You have already booked this flight.');
      return;
    }

    setConfirming(true);
    try {
      await setDoc(bookingRef, {
        flightReference: flight.flightReference,
        passengerName: userInfo.name,
        psnUsername: '',
        from: flight.from,
        to: flight.to,
        date: flight.date,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        aircraft: flight.aircraft,
        flightCode: flight.flightCode,
        class: flight.class,
        gate: flight.gate,
        price: flight.price,
        seat,
        terminal: '2',
        bookedAt: Timestamp.now(),
        distance,

        // 👇 ADD THESE so getFlightStatus works on bookings too
        departureTimestamp: flight.departureTimestamp,   // ISO string
        delayMins: flight.delayMins || 0,
        durationMins: flight.durationMins || 1,

        // for lifecycle
        landedAt: null,
        avMilesAwarded: false,
      });


      await updateDoc(flightRef, {
        takenSeats: arrayUnion(seat),
      });

      let emailSuccess = false;

      try {
        const dataUrl = await toPng(svgRef.current);

        await emailjs.send(
          'AVInfo',
          'template_8vmzb7g',
          {
            to_email: userInfo.email,
            passenger_name: userInfo.name,
            flight_reference: flight.flightReference,
            flight_code: flight.flightCode,
            from: flight.from,
            to: flight.to,
            date: flight.date,
            departure_time: flight.departureTime,
            arrival_time: flight.arrivalTime,
            aircraft: flight.aircraft,
            gate: flight.gate,
            class: flight.class,
            price: flight.price,
            seat,
            boarding_pass_img: dataUrl,
          },
          'e1z8UXANJ6NDj9Kfe'
        );

        emailSuccess = true;
      } catch (emailErr) {
        console.warn('📧 Email sending failed (harmless on mobile):', emailErr.message);
      }

      if (emailSuccess) {
        alert('🎉 Booking confirmed! Check your email.');
      } else {
        alert('✅ Booking confirmed! (Email failed — try again later)');
      }

      navigate('/');
    } catch (err) {
      console.error('❌ Booking failed:', err.message);
      alert('Booking failed. Try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="confirm-page">
      <div className="confirm-container">
        <h2>Confirm Your Booking</h2>
        <div className="flight-summary">
          <p><strong>Flight Reference:</strong> {flight.flightReference}</p>
          <p><strong>Flight Code:</strong> {flight.flightCode}</p>
          <p><strong>Name:</strong> {userInfo.name}</p>
          <p><strong>From:</strong> {flight.from}</p>
          <p><strong>To:</strong> {flight.to}</p>
          <p><strong>Date:</strong> {flight.date}</p>
          <p><strong>Time:</strong> {flight.departureTime} - {flight.arrivalTime}</p>
          <p><strong>Aircraft:</strong> {flight.aircraft}</p>
          <p><strong>Gate:</strong> {flight.gate}</p>
          <p><strong>Class:</strong> {flight.class}</p>
          <p><strong>Price:</strong> {flight.price}</p>
          <p><strong>Seat:</strong> {seat}</p>
        </div>

        <div className="boarding-pass-svg-wrapper" ref={svgRef}>
          <BoardingPassSVG
            from={flight.from}
            to={flight.to}
            date={flight.date}
            departureTime={flight.departureTime}
            arrivalTime={flight.arrivalTime}
            name={userInfo.name}
            flightRef={flight.flightReference}
            seat={seat}
            classType={flight.class}
            gate={flight.gate}
            flightCode={flight.flightCode}
            aircraft={flight.aircraft}
          />
        </div>

        <button
          className="confirm-btn"
          onClick={handleConfirmBooking}
          disabled={confirming || !dataReady}
        >
          {confirming ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}

export default ConfirmBooking;
