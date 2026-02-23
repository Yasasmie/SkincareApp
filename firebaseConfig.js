// firebaseConfig.ts (or firebaseConfig.js)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCFp1-hfC1PS14YeB-cfW7jZM-t2kZOHnw",
  authDomain: "glowai-96a93.firebaseapp.com",
  projectId: "glowai-96a93",
  storageBucket: "glowai-96a93.firebasestorage.app",
  messagingSenderId: "93311804363",
  appId: "1:93311804363:web:2b5f34f58bc66c847f8c4e",
};

// Initialize app only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Standard web-style Auth (works in Expo RN too)
const auth = getAuth(app);

// Firestore with RN-friendly settings
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export { app, auth, db };
