// ✅ filterLiveFlightsForMap.js
export const filterLiveFlightsForMap = (flights) => {
  const now = new Date();

  return flights.filter(flight => {
    const dep = new Date(flight.departureTimestamp);
    if (isNaN(dep.getTime())) return false;

    const delay = flight.delayMins || 0;
    const duration = flight.durationMins || 1;

    dep.setMinutes(dep.getMinutes() + delay);
    const landing = new Date(dep.getTime() + duration * 60000);
    const expiry = new Date(landing.getTime() + 15 * 1000); // show 15s longer

    return now >= dep && now < expiry;
  });
};
