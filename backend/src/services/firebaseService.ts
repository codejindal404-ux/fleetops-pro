import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  WhereFilterOp
} from 'firebase/firestore';
import { firestore } from '../config/firebase.ts';

export interface QueryFilter {
  field: string;
  op: WhereFilterOp;
  value: any;
}

export class FirebaseService {
  /**
   * Create or set a document in a Firestore collection
   */
  public async createDocument<T = any>(
    collectionName: string,
    data: any,
    customId?: string
  ): Promise<T> {
    const now = new Date().toISOString();
    const id = customId || `doc_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const docData = {
      id,
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };

    const docRef = doc(firestore, collectionName, id);
    await setDoc(docRef, docData);
    return docData as T;
  }

  /**
   * Fetch a single document by ID from a Firestore collection
   */
  public async getDocument<T = any>(collectionName: string, docId: string): Promise<T | null> {
    const docRef = doc(firestore, collectionName, docId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as T;
  }

  /**
   * Fetch all documents from a Firestore collection with optional filters
   */
  public async getCollection<T = any>(
    collectionName: string,
    filters: QueryFilter[] = []
  ): Promise<T[]> {
    const colRef = collection(firestore, collectionName);
    let q = query(colRef);
    if (filters.length > 0) {
      const wheres = filters.map((f) => where(f.field, f.op, f.value));
      q = query(colRef, ...wheres);
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T));
  }

  /**
   * Update fields of a document in Firestore
   */
  public async updateDocument<T = any>(
    collectionName: string,
    docId: string,
    updates: any
  ): Promise<T | null> {
    const docRef = doc(firestore, collectionName, docId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return null;
    }

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(docRef, updateData);
    const updatedSnap = await getDoc(docRef);
    return { id: updatedSnap.id, ...updatedSnap.data() } as T;
  }

  /**
   * Delete a document from Firestore
   */
  public async deleteDocument(collectionName: string, docId: string): Promise<boolean> {
    const docRef = doc(firestore, collectionName, docId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return false;
    }
    await deleteDoc(docRef);
    return true;
  }
}

export const firebaseService = new FirebaseService();
