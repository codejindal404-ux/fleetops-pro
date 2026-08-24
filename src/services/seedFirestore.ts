import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export async function clearFirestoreData() {
  console.log('Clearing all dummy data from Cloud Firestore database:', firebaseConfig.firestoreDatabaseId);

  const collectionsToClear = ['users', 'vehicles', 'bookings', 'repairLogs', 'invoices', 'feedbacks'];

  for (const colName of collectionsToClear) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, colName, docSnap.id));
      }
      console.log(`Successfully cleared collection: ${colName}`);
    } catch (err) {
      console.error(`Error clearing collection ${colName}:`, err);
    }
  }

  console.log('Firestore clean-up complete! All dummy data deleted from Firestore.');
}

export async function seedFirestore() {
  // Clearing data as requested by user
  await clearFirestoreData();
}
