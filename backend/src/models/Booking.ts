import { BookingStatus } from '../types/index.ts';

export interface BookingModel {
  id: string;
  customerId: string;
  vehicleId: string;
  serviceCenterId?: string | null;
  mechanicId?: string | null;
  serviceType: string;
  status: BookingStatus;
  scheduledDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  createdAt: string;
}
