// screens/firebaseConfig.js - FIXED VERSION
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Simplified import
import { getFirestore } from 'firebase/firestore';
// Remove AsyncStorage import for now to simplify

const firebaseConfig = {
  apiKey: "AIzaSyCZYDDL4_haEktzDUGO0Eg8Y3T30GfzpaQ",
  authDomain: "clearday-25b0f.firebaseapp.com",
  projectId: "clearday-25b0f",
  storageBucket: "clearday-25b0f.firebasestorage.app",
  messagingSenderId: "542864788052",
  appId: "1:542864788052:web:a3dda6ca2943e10868fbc1",
  measurementId: "G-XE341B3X2B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth (simplified)
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);


export default app;