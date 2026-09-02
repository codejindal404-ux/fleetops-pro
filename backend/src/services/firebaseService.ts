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
  orderBy,
  limit,
  WhereFilterOp,
  OrderByDirection
} from 'firebase/firestore';
import { firestore } from '../config/firebase.ts';

export interface QueryFilter {
  field: string;
  op: WhereFilterOp;
  value: any;
}

export class FirebaseService {
  /**
   * Create or overwrite a document in a Firestore collection
   */
  public async createDocument<T = any>(
    collectionName: string,
    data: any,
    customId?: string
  ): Promise<T> {
    try {
      const now = new Date().toISOString();
      const id = customId || `${collectionName.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docData = {
        ...data,
        id,
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now
      };

      const docRef = doc(firestore, collectionName, id);
      await setDoc(docRef, docData);
      return docData as T;
    } catch (error) {
      console.error(`FirebaseService.createDocument error on ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a single document by ID from a Firestore collection
   */
  public async getDocument<T = any>(collectionName: string, docId: string): Promise<T | null> {
    try {
      if (!docId) return null;
      const docRef = doc(firestore, collectionName, docId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        return null;
      }
      return { id: snapshot.id, ...snapshot.data() } as T;
    } catch (error) {
      console.error(`FirebaseService.getDocument error on ${collectionName}/${docId}:`, error);
      return null;
    }
  }

  /**
   * Fetch all documents from a Firestore collection with optional filters
   */
  public async getCollection<T = any>(
    collectionName: string,
    filters: QueryFilter[] = []
  ): Promise<T[]> {
    try {
      const colRef = collection(firestore, collectionName);
      let q = query(colRef);
      if (filters.length > 0) {
        const wheres = filters.map((f) => where(f.field, f.op, f.value));
        q = query(colRef, ...wheres);
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T));
    } catch (error) {
      console.error(`FirebaseService.getCollection error on ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Query documents with filters, sorting, and limit
   */
  public async queryDocuments<T = any>(
    collectionName: string,
    filters: QueryFilter[] = [],
    orderByField?: string,
    orderDirection: OrderByDirection = 'desc',
    limitCount?: number
  ): Promise<T[]> {
    try {
      const colRef = collection(firestore, collectionName);
      const constraints: any[] = filters.map((f) => where(f.field, f.op, f.value));
      
      if (orderByField) {
        constraints.push(orderBy(orderByField, orderDirection));
      }
      if (limitCount && limitCount > 0) {
        constraints.push(limit(limitCount));
      }

      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T));
    } catch (error) {
      console.error(`FirebaseService.queryDocuments error on ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Update fields of a document in Firestore
   */
  public async updateDocument<T = any>(
    collectionName: string,
    docId: string,
    updates: any
  ): Promise<T | null> {
    try {
      if (!docId) return null;
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
    } catch (error) {
      console.error(`FirebaseService.updateDocument error on ${collectionName}/${docId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document from Firestore
   */
  public async deleteDocument(collectionName: string, docId: string): Promise<boolean> {
    try {
      if (!docId) return false;
      const docRef = doc(firestore, collectionName, docId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        return false;
      }
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`FirebaseService.deleteDocument error on ${collectionName}/${docId}:`, error);
      return false;
    }
  }

  // --- Specialized Collection Helpers ---

  // Users
  public async getUserByEmail(email: string) {
    if (!email) return null;
    const users = await this.getCollection('users', [{ field: 'email', op: '==', value: email.trim().toLowerCase() }]);
    return users.length > 0 ? users[0] : null;
  }

  public async getUserById(id: string) {
    return this.getDocument('users', id);
  }

  // Vehicles
  public async getVehiclesByOwner(ownerId: string) {
    return this.getCollection('vehicles', [{ field: 'ownerId', op: '==', value: ownerId }]);
  }

  public async getVehicleByReg(reg: string) {
    const vehs = await this.getCollection('vehicles', [{ field: 'registrationNumber', op: '==', value: reg.toUpperCase() }]);
    return vehs.length > 0 ? vehs[0] : null;
  }

  public async getVehicleByEngineNumber(engineNo: string) {
    if (!engineNo || !engineNo.trim()) return null;
    const vehs = await this.getCollection('vehicles', [{ field: 'engineNumber', op: '==', value: engineNo.trim().toUpperCase() }]);
    return vehs.length > 0 ? vehs[0] : null;
  }

  public async getVehicleByChassisNumber(chassisNo: string) {
    if (!chassisNo || !chassisNo.trim()) return null;
    const vehs = await this.getCollection('vehicles', [{ field: 'chassisNumber', op: '==', value: chassisNo.trim().toUpperCase() }]);
    return vehs.length > 0 ? vehs[0] : null;
  }

  // Bookings
  public async getBookingsByCustomer(customerId: string) {
    return this.getCollection('bookings', [{ field: 'customerId', op: '==', value: customerId }]);
  }

  public async getBookingsByMechanic(mechanicId: string) {
    const direct = await this.getCollection('bookings', [{ field: 'mechanicId', op: '==', value: mechanicId }]);
    const assigned = await this.getCollection('bookings', [{ field: 'assignedMechanicId', op: '==', value: mechanicId }]);
    const all = [...direct, ...assigned];
    const uniqueMap = new Map();
    all.forEach(b => uniqueMap.set(b.id, b));
    return Array.from(uniqueMap.values());
  }

  // Invoices
  public async getInvoiceByBooking(bookingId: string) {
    const invs = await this.getCollection('invoices', [{ field: 'bookingId', op: '==', value: bookingId }]);
    return invs.length > 0 ? invs[0] : null;
  }

  // Feedback
  public async getFeedbacksByMechanic(mechanicId: string) {
    return this.getCollection('feedback', [{ field: 'mechanicId', op: '==', value: mechanicId }]);
  }

  // Notifications
  public async getNotificationsByUser(userId: string) {
    return this.getCollection('notifications', [{ field: 'userId', op: '==', value: userId }]);
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
