// src/utils/moveLandedFlights.js
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { getFlightStatus } from "./getFlightStatus";
import { auth } from "../firebase/firebaseConfig";

export const moveLandedFlights = async () => {
  const db = getFirestore();
  const user = auth.currentUser;
  if (!user) return;

  const bookingsRef = collection(db, "users", user.uid, "bookings");
  const pastRef = collection(db, "users", user.uid, "pastFlights");

  const snapshot = await getDocs(bookingsRef);
  const now = new Date();

  for (const docSnap of snapshot.docs) {
    const booking = docSnap.data();
    const id = docSnap.id;

    // Must have timing fields now (we added them on booking)
    const { status } = getFlightStatus(booking);

    let landedAt = booking.landedAt ? new Date(booking.landedAt) : null;

    // 1) If just landed, stamp landedAt once
    if (status === "Landed" && !landedAt) {
      landedAt = now;
      await setDoc(
        doc(bookingsRef, id),
        { landedAt: now.toISOString() },
        { merge: true }
      );
      // continue to awarding logic below (minsPassed will be 0 now)
    }

    if (status === "Landed" && landedAt) {
      const minsPassed = (now - landedAt) / (1000 * 60);

      // 2) Award AVMiles once after 10 mins
      if (!booking.avMilesAwarded && minsPassed >= 10) {
        const miles = booking.distance || 0;

        // increment user's AVMiles
        await updateDoc(doc(db, "users", user.uid), {
          AVMiles: increment(miles),
        });

        await setDoc(
          doc(bookingsRef, id),
          { avMilesAwarded: true },
          { merge: true }
        );
        console.log(`🏅 Awarded ${miles} AVMiles for ${id}`);
      }

      // 3) Move to pastFlights after 20 mins
      if (minsPassed >= 20) {
        await setDoc(doc(pastRef, id), booking, { merge: true });
        await deleteDoc(doc(bookingsRef, id));
        console.log(`✅ Moved ${id} to pastFlights`);
      }
    }
  }
};
