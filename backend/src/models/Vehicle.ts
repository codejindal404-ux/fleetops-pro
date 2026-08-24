export interface VehicleModel {
  id: string;
  ownerId: string;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  vehicleType: string;
  fuelType?: string;
  mileage?: number;
  engineNumber?: string;
  chassisNumber?: string;
  healthScore?: number;
  nextServiceDueDate?: string;
  createdAt: string;
}
