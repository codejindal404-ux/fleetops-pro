import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json' with { type: 'json' };

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Use default Firestore database for gen-lang-client-0516055714
export const firestore = getFirestore(app);
export const db = firestore;

export default app;
