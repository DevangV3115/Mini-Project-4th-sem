import { initializeApp, getApps } from "firebase/app";
import { getAuth, initializeRecaptchaConfig, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getApp() {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

export let auth: Auth;
export let db: Firestore;

try {
  const app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  if (typeof window !== "undefined") {
    initializeRecaptchaConfig(auth).catch(() => {});
  }
} catch {
  auth = {} as Auth;
  db = {} as Firestore;
}
