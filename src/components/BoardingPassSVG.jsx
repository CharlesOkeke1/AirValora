// src/components/BoardingPassSVG.jsx
import React from 'react';
import QRCode from 'react-qr-code';
import './Home.css';

const BoardingPassSVG = ({
  from,
  to,
  date,
  departureTime,
  arrivalTime,
  name,
  classType,
  flightCode,
  gate,
  seat,
  aircraft,
  flightRef
}) => {
  return (
    <svg
      width="100%"
      viewBox="0 0 800 300"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: 'white' }}
    >
      <rect width="800" height="300" rx="40" fill="#fff" />

      {/* Top Purple Bar */}
      <rect x="0" y="0" width="800" height="60" rect rx="20" fill="#7D4AEA" />
      <text x="40" y="38" fontSize="20" fill="white" fontWeight="bold">✈ BOARDING PASS</text>
      <text x="650" y="38" fontSize="18" fill="white">AIR VALORA</text>

      {/* FROM / TO */}
      <text x="40" y="100" fontSize="16" fontWeight="bold">FROM:</text>
      <text x="120" y="100" fontSize="24">{from}</text>

      <text x="300" y="100" fontSize="16" fontWeight="bold">TO:</text>
      <text x="360" y="100" fontSize="24">{to}</text>

      {/* Departure / Arrival */}
      <text x="40" y="130" fontSize="14">DEP. DATE</text>
      <text x="120" y="130" fontSize="14">{date}</text>
      <text x="40" y="150" fontSize="14">DEP. TIME</text>
      <text x="120" y="150" fontSize="14">{departureTime}</text>

      <text x="300" y="130" fontSize="14">ARRIV. DATE</text>
      <text x="400" y="130" fontSize="14">{date}</text>
      <text x="300" y="150" fontSize="14">ARRIV. TIME</text>
      <text x="400" y="150" fontSize="14">{arrivalTime}</text>

      {/* Passenger Info */}
      <text x="550" y="100" fontSize="14">Passenger</text>
      <text x="640" y="100" fontSize="18">{name}</text>
      <text x="550" y="130" fontSize="14">Class</text>
      <text x="640" y="130" fontSize="16">{classType}</text>

      <text x="550" y="155" fontSize="12">Boarding Time</text>
      <text x="640" y="155" fontSize="12">3 mins before</text>

      <text x="550" y="170" fontSize="12">Departure Time</text>
      <text x="640" y="170" fontSize="12">{departureTime}</text>

      {/* QR Code */}
      <foreignObject x="655" y="190" width="75" height="75">
        <QRCode value={`https://airvalora.com/flight-status/${flightRef}`} size={90} />
      </foreignObject>

      {/* Footer Divider */}
      <line x1="20" y1="220" x2="500" y2="220" stroke="#000" strokeDasharray="4 4" />

      {/* Footer Labels and Values in Columns */}
      <text x="50" y="240" fontSize="12">Flight No.</text>
      <text x="50" y="255" fontSize="14">{flightCode}</text>

      <text x="140" y="240" fontSize="12">Terminal</text>
      <text x="140" y="255" fontSize="14">1</text>

      <text x="230" y="240" fontSize="12">Gate</text>
      <text x="230" y="255" fontSize="14">{gate}</text>

      <text x="320" y="240" fontSize="12">Seat</text>
      <text x="320" y="255" fontSize="14">{seat}</text>

      <text x="410" y="240" fontSize="12">Aircraft</text>
      <text x="410" y="255" fontSize="14">{aircraft}</text>

      <text x="550" y="240" fontSize="12">FLIGHT REF.</text>
      <text x="550" y="255" fontSize="12">{flightRef}</text>

      <text x="650" y="280" fontSize="12">FLIGHT STATUS</text>
    </svg>
  );
};

export default BoardingPassSVG;
