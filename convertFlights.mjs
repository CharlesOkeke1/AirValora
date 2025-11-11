import flights from './src/data/flights.js';
import { writeFile } from 'fs/promises';

const output = {};

flights.forEach(f => {
  output[f.flightReference] = f;
});

const final = { flights: output };

await writeFile('flights-upload.json', JSON.stringify(final, null, 2));

console.log('✅ flights-upload.json created');
