export interface ServiceCenterModel {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  rating: number;
  specialties?: string[];
  workingStatus?: string;
  isVerified?: boolean;
  createdAt: string;
}
