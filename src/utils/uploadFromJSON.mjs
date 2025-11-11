// uploadFromJSON.mjs
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(
  await readFile(new URL('../firebase/serviceAccountKey.json', import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const flightsJSON = JSON.parse(await readFile('./flights-upload.json', 'utf-8'));
const flights = Object.values(flightsJSON.flights);

console.log(`🧭 Found ${flights.length} flights`);

const BATCH_SIZE = 10;

const sleep = ms => new Promise(res => setTimeout(res, ms));

const uploadFlights = async () => {
  console.log('🚀 Starting upload...');

  for (let i = 0; i < flights.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const slice = flights.slice(i, i + BATCH_SIZE);

    slice.forEach((flight) => {
      const ref = db.collection('flights').doc(flight.flightReference);
      batch.set(ref, flight);
    });

    try {
      await batch.commit();
      console.log(`✅ Uploaded batch ${i / BATCH_SIZE + 1}`);
    } catch (err) {
      console.error(`❌ Failed batch ${i / BATCH_SIZE + 1}: ${err.message}`);
      console.log('⏳ Retrying after 3s...');
      await sleep(3000);
      i -= BATCH_SIZE; // retry same batch
    }
  }

  console.log('🎉 Upload complete.');
};

uploadFlights().catch((err) => {
  console.error('❌ Upload failed:', err.message);
});
