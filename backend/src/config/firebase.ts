import dotenv from 'dotenv';
dotenv.config();
import admin from 'firebase-admin';
import firebaseConfigJson from '../../../firebase-applet-config.json' with { type: 'json' };

const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || 'fleetops-pro-98e1d';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

if (!admin.apps.length) {
  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
  } else {
    admin.initializeApp({
      projectId
    });
  }
}

export const firestore = admin.firestore();
export const db = firestore;
export default admin;

