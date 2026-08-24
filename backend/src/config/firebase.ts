import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../../firebase-applet-config.json' with { type: 'json' };

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  appId: process.env.FIREBASE_APP_ID || firebaseConfigJson.appId,
  apiKey: process.env.FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || '(default)',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firestore = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const db = firestore;

export default app;
