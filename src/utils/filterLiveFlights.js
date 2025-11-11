// ✅ filterLiveFlightsForList.js
export const filterLiveFlightsForList = (flights) => {
  const now = new Date();

  return flights.filter(flight => {
    const dep = new Date(flight.departureTimestamp);
    if (isNaN(dep.getTime())) return false;

    const delay = flight.delayMins || 0;
    const duration = flight.durationMins || 1;

    dep.setMinutes(dep.getMinutes() + delay);
    const landing = new Date(dep.getTime() + duration * 60000);
    const showStart = new Date(dep.getTime() - 10 * 60000); // 10 mins before departure
    const expiry = new Date(landing.getTime() + 10 * 60000); // 10 mins after landing

    return now >= showStart && now < expiry;
  });
};