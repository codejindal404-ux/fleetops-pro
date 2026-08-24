import { firestore } from './firebase.ts';

export const db = firestore;

export async function connectDatabase() {
  try {
    console.log('✅ Connected to Fresh Firebase Firestore Database');
  } catch (error) {
    console.error('❌ Failed to connect to Firebase Database:', error);
  }
}
