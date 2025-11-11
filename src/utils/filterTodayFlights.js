// ✅ filterTodayFlights.js
export const filterTodayFlights = (flights) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

  return flights.filter(flight => {
    if (flight.date !== today) return false;

    const dep = new Date(flight.departureTimestamp);
    if (isNaN(dep.getTime())) return false;

    const delay = flight.delayMins || 0;
    const duration = flight.durationMins || 1;

    dep.setMinutes(dep.getMinutes() + delay);
    const landing = new Date(dep.getTime() + duration * 60000);
    const expiry = new Date(landing.getTime() + 20 * 60000); // 20 mins after landing

    return now < expiry;
  });
};