import { firebaseService } from './firebaseService.ts';

export class DBService {
  public firebase = firebaseService;

  public async getUsers() {
    return firebaseService.getCollection('users');
  }

  public async getUserById(id: string) {
    return firebaseService.getDocument('users', id);
  }

  public async getVehicles() {
    return firebaseService.getCollection('vehicles');
  }

  public async getBookings() {
    return firebaseService.getCollection('bookings');
  }

  public async getInvoices() {
    return firebaseService.getCollection('invoices');
  }

  public async getServiceCenters() {
    return firebaseService.getCollection('serviceCenters');
  }

  public async getNotifications(userId: string) {
    return firebaseService.getCollection('notifications', [{ field: 'userId', op: '==', value: userId }]);
  }
}

export const dbService = new DBService();
export { firebaseService };
export default dbService;
