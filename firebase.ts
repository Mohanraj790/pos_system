import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// TODO: Replace with your actual Firebase Project Configuration
// You can find this in the Firebase Console -> Project Settings -> General -> Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyChJlEspMB9PQ5LAXIf1f44ux5BDcZn16U",
  authDomain: "pos-system-c7fc8.firebaseapp.com",
  projectId: "pos-system-c7fc8",
  storageBucket: "pos-system-c7fc8.firebasestorage.app",
  messagingSenderId: "587485381942",
  appId: "1:587485381942:web:211ad6222db54f2e989f97",
  measurementId: "G-X1ZMH89S8P"
};


let app;
let db: Firestore | null = null;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  // Initialize Firestore
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  console.warn("App running in offline mode (Firebase features disabled).");
}

export { db };
 