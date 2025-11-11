import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBiYW4LJTlaaj98JLvKJI_o1NOObrlsheQ",
  authDomain: "air-valora.firebaseapp.com",
  projectId: "air-valora",
  storageBucket: "air-valora.appspot.com", // ✅ FIXED this line (it had `.firebasestorage.app` which is incorrect)
  messagingSenderId: "702994153530",
  appId: "1:702994153530:web:f1c6eb1febb78fd1fbb503",
  measurementId: "G-L7TBNTMRYT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


export { app, db, auth, firebaseConfig }; // ✅ Export it
