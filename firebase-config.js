// Firebase Configuration for Lashed By Anna Booking System
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
    apiKey: "AIzaSyDTkdDtvUiabMwjlsl7b4HoxpZonWkg1HM",
    authDomain: "anaidesth.firebaseapp.com",
    projectId: "anaidesth",
    storageBucket: "anaidesth.firebasestorage.app",
    messagingSenderId: "1081724265148",
    appId: "1:1081724265148:web:433238f81f9e5b377466b9",
    measurementId: "G-HN0HR10KHY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
    try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectFunctionsEmulator(functions, 'localhost', 5001);
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('🔧 Connected to Firebase emulators');
    } catch (error) {
        console.log('Firebase emulators already connected or not available');
    }
}

export default app;