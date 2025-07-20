// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQuVcC0POmWloPCQD2QkJhvRGNgNbpBao",
  authDomain: "peakbrew-modified.firebaseapp.com",
  projectId: "peakbrew-modified",
  storageBucket: "peakbrew-modified.firebasestorage.app",
  messagingSenderId: "152074649457",
  appId: "1:152074649457:web:b700837f48b641837b00d0",
  measurementId: "G-15YF3LDE0L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;