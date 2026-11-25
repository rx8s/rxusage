"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// NEXT_PUBLIC_* values are inlined at build time, so each must be referenced literally.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

/** True when the minimum web config is present (lets the UI explain a missing setup instead of crashing). */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

export type FirebaseService = "auth" | "firestore" | "database" | "storage" | "analytics";

/** Which services have the config they need. */
export const serviceConfig: Record<FirebaseService, boolean> = {
  auth: isFirebaseConfigured && Boolean(firebaseConfig.authDomain),
  firestore: isFirebaseConfigured,
  database: isFirebaseConfigured && Boolean(firebaseConfig.databaseURL),
  storage: isFirebaseConfigured && Boolean(firebaseConfig.storageBucket),
  analytics: isFirebaseConfigured && Boolean(firebaseConfig.measurementId),
};

function app(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Copy .env.example to .env.local and fill it in.");
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseAuth = (): Auth => getAuth(app());
export const firestore = (): Firestore => getFirestore(app());
export const realtimeDb = (): Database => getDatabase(app());
export const storage = (): FirebaseStorage => getStorage(app());

let analyticsPromise: Promise<Analytics | null> | undefined;
/** Analytics only runs in supported browsers; resolves to null elsewhere. */
export function analytics(): Promise<Analytics | null> {
  if (!serviceConfig.analytics || typeof window === "undefined") return Promise.resolve(null);
  analyticsPromise ??= isSupported().then((ok) => (ok ? getAnalytics(app()) : null));
  return analyticsPromise;
}
