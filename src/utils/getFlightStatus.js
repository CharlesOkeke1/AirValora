export const getFlightStatus = (flight) => {
  if (!flight || !flight.departureTimestamp) return { status: "--", color: "gray" };

  const now = new Date();

  const originalDep =
    typeof flight.departureTimestamp?.toDate === "function"
      ? flight.departureTimestamp.toDate()
      : new Date(flight.departureTimestamp);

  if (isNaN(originalDep.getTime())) {
    console.warn("⚠️ Invalid departureTimestamp:", flight.departureTimestamp);
    return { status: "--", color: "gray" };
  }

  const delayMins = flight.delayMins || 0;
  const durationMins = flight.durationMins || 1;
  const delayedDep = new Date(originalDep.getTime() + delayMins * 60000);

  const boardingTime = new Date(delayedDep.getTime() - 3 * 60 * 1000);
  const takeoffStart = new Date(delayedDep.getTime() - 15 * 1000);
  const takeoffEnd = new Date(delayedDep.getTime() + 5 * 1000);
  const landingTime = new Date(delayedDep.getTime() + durationMins * 60000 + 15 * 1000);

  // Manual override
  if (flight.statusOverride === "Cancelled") return { status: "Cancelled", color: "red" };
  if (flight.statusOverride === "Delayed") return { status: "Delayed", color: "red" };

  if (delayMins > 0 && now > originalDep && now < takeoffStart) {
    return { status: "Delayed", color: "red" };
  }

  if (now < boardingTime) return { status: "--", color: "gray" };
  if (now >= boardingTime && now < takeoffStart) return { status: "Boarding", color: "orange" };
  if (now >= takeoffStart && now < takeoffEnd) return { status: "Taking Off", color: "green" };
  if (now >= takeoffEnd && now < landingTime) return { status: "Mid-Air", color: "green" };
  return { status: "Landed", color: "gray" };
};
