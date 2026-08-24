export interface RepairLogModel {
  id: string;
  bookingId: string;
  vehicleId?: string;
  mechanicId?: string;
  action?: string;
  partsReplaced?: any[];
  hoursSpent?: number;
  cost?: number;
  notes?: string;
  createdAt: string;
}
