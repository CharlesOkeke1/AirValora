// ✅ uploadFlights.mjs
import admin from 'firebase-admin';
import flights from '../data/flights.js';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(
  await readFile(new URL('../firebase/serviceAccountKey.json', import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const uploadFlights = async () => {
  console.log(`🧭 Found ${flights.length} flights`);

  for (let flight of flights) {
    try {
      const dateTimeString = `${flight.date}T${flight.departureTime}`;
      flight.departureTimestamp = new Date(dateTimeString).toISOString();

      const ref = db.collection('flights').doc(flight.flightReference);
      await ref.set(flight);

      console.log(`✅ Uploaded ${flight.flightReference}`);
    } catch (err) {
      console.error(`❌ Failed ${flight.flightReference}: ${err.message}`);
    }
  }

  console.log('🎉 Upload complete.');
};

uploadFlights().catch((err) => {
  console.error('❌ Upload failed:', err.message);
});