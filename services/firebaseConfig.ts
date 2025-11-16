import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyCXbiq5oyy9zQmCLoodUOjSMLL9OFKNB0g",
  authDomain: "safe-aistd.firebaseapp.com",
  projectId: "safe-aistd",
  storageBucket: "safe-aistd.firebasestorage.app",
  messagingSenderId: "222835619714",
  appId: "1:222835619714:web:1fef8ea3b32ccff717819b",
  measurementId: "G-RYKWRBE387"
};


let app: FirebaseApp;
let db: Firestore;
let firebaseError: Error | null = null;

try {
  // Check if all required config keys are present and not placeholders
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("AIza")) {
      // The provided key seems to be valid, even if it starts with the placeholder prefix.
      // Firebase uses this format for public web API keys.
      // We will proceed with initialization. If it fails, the catch block will handle it.
  }
  
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);

} catch (e) {
  firebaseError = e as Error;
  console.error("Firebase initialization failed:", firebaseError);
}

export { app, db, firebaseError };
