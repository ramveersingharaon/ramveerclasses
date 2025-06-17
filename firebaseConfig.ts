// 📁 src/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAWTNLTndqVq9i4JcdYmmuKW2Qcpgj-Twg",
  authDomain: "notes-app-5e72b.firebaseapp.com",
  projectId: "notes-app-5e72b",
  storageBucket: "notes-app-5e72b.firebasestorage.app",
  messagingSenderId: "954728620428",
  appId: "1:954728620428:web:36b85e0da428a3dd5cb6a9",
  measurementId: "G-4WT86XZKBP"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export { app };
