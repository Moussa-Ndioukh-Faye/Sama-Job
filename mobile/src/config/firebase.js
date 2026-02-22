/**
 * Configuration Firebase
 * Initialisation du SDK Firebase pour l'authentification
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// For React Native persistence with Firebase Auth
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Firebase - À remplacer avec vos vraies valeurs
// Obtenez ces valeurs depuis https://console.firebase.google.com
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDemoKey",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "samajob-demo.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "samajob-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "samajob-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:ios:abcd1234"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser l'authentification — use initializeAuth on React Native to enable persistence
let auth;
try {
  // Use React Native persistence (AsyncStorage) so auth state persists between sessions
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  // Fallback to getAuth for web or if initialization fails
  auth = getAuth(app);
}

// Initialiser Firestore (optionnel, pour la réaltime)
export const db = getFirestore(app);

export { auth };
export default app;
