export type Role = 'CUSTOMER' | 'ADMIN' | 'MECHANIC';

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'INSPECTION'
  | 'REPAIRING'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'CANCELLED';

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status?: 'ACTIVE' | 'SUSPENDED';
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  registrationNumber: string;
  brand: string;
  model: string;
  year: number;
  vehicleType: string;
  type?: string;
  createdAt: string;
  mileage?: number;
  lastServiceMileage?: number;
  nextMaintenanceMileage?: number;
  avgMonthlyMileage?: number;
  serviceIntervalMonths?: number;
  serviceIntervalMileage?: number;
  lastServiceDate?: string;
  nextServiceDueDate?: string;
  recurringReminderEnabled?: boolean;
  lastReminderSentAt?: string;
  reminderStatus?: 'OK' | 'DUE_SOON' | 'OVERDUE';
  serviceReminderNotes?: string;
}

export interface ServiceReminderEvaluation {
  vehicleId: string;
  isDue: boolean;
  status: 'OK' | 'DUE_SOON' | 'OVERDUE';
  reason: 'TIME_30_DAYS' | 'MILEAGE_THRESHOLD' | 'OVERDUE' | 'NONE';
  daysRemaining: number;
  milesRemaining: number;
  projectedDaysToMileage: number;
  nextServiceDueDate: string;
  nextMaintenanceMileage: number;
  currentMileage: number;
  lastServiceDate?: string;
  lastServiceMileage?: number;
  recommendedService: string;
  title: string;
  message: string;
  notificationSent?: boolean;
}

export interface VehicleReminderConfig {
  serviceIntervalMonths?: number;
  serviceIntervalMileage?: number;
  avgMonthlyMileage?: number;
  recurringReminderEnabled?: boolean;
  lastServiceDate?: string;
  lastServiceMileage?: number;
  serviceReminderNotes?: string;
}

export interface ReplacedPartItem {
  partName: string;
  partCode?: string;
  quantity: number;
  unitCost: number;
}

export interface RepairLog {
  id: string;
  bookingId: string;
  action?: string;
  note: string;
  partsReplaced?: ReplacedPartItem[];
  hoursSpent?: number;
  labourRate?: number;
  labourCost?: number;
  partsCost?: number;
  cost?: number;
  progressPercentage?: number;
  updatedBy: string;
  createdAt: string;
  updatedByUser?: { id: string; name: string; role: Role } | null;
}

export interface Invoice {
  id: string;
  bookingId: string;
  serviceCharges: number;
  partsCost: number;
  tax: number;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt?: string | null;
  booking?: Booking;
  vehicle?: Vehicle;
  customer?: User;
}

export interface Feedback {
  id: string;
  bookingId: string;
  customerId: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer?: User;
}

export interface Booking {
  id: string;
  vehicleId: string;
  customerId: string;
  mechanicId?: string | null;
  assignedMechanicId?: string | null;
  assignedMechanicName?: string | null;
  serviceType: string;
  serviceDate?: string;
  preferredDate: string;
  issueDescription?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
  customer?: User;
  mechanic?: User;
  repairLogs?: RepairLog[];
  invoice?: Invoice;
  feedback?: Feedback;
  serviceCenterId?: string | null;
  serviceCenter?: ServiceCenter;
  customerName?: string;
  vehicleName?: string;
  serviceCenterName?: string;
  diagnostics?: OBDDiagnosticRecord[];
  inspection?: RepairInspectionReport;
  images?: RepairImageRecord[];
  partsRequests?: SparePartsRequestRecord[];
  chatMessages?: ChatMessage[];
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  estimatedCost?: number;
  progressPercentage?: number;
}

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_APPROVED'
  | 'MECHANIC_ASSIGNED'
  | 'SERVICE_STARTED'
  | 'SERVICE_PROGRESS_UPDATE'
  | 'SERVICE_COMPLETED'
  | 'INVOICE_GENERATED'
  | 'PAYMENT_RECEIVED'
  | 'REVIEW_RECEIVED'
  | 'SERVICE_CENTER_STATUS'
  | 'SERVICE_CENTER_VERIFICATION'
  | 'SERVICE_REMINDER'
  | 'MAINTENANCE_DUE'
  | 'SYSTEM_ALERT';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  data?: any;
  createdAt: string;
}

export type ServiceCenterWorkingStatus = 'OPEN' | 'BUSY' | 'CLOSED';

export interface ServiceCenter {
  id: string;
  name: string;
  ownerId?: string | null;
  address: string;
  city: string;
  state?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  capacity?: number;
  pricePerHour?: number;
  status?: string;
  operatingHours?: string;
  services?: string[];
  rating?: number;
  averageRating: number;
  totalReviews: number;
  totalServicesCompleted: number;
  experienceYears: number;
  isVerified: boolean;
  workingStatus?: ServiceCenterWorkingStatus;
  availableMechanics?: number;
  specialties?: string[];
  imageUrl?: string;
  totalRevenue?: number;
  totalActiveBookings?: number;
  averageResponseTime?: number;
  distanceKm?: number;
  distanceText?: string;
  recommendationScore?: number;
  isBestChoice?: boolean;
  recommendationReasons?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName?: string;
  performedByRole?: Role | 'SYSTEM';
  targetType: 'USER' | 'VEHICLE' | 'BOOKING' | 'INVOICE' | 'FEEDBACK' | 'MARKETPLACE' | 'SYSTEM';
  targetId?: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  createdAt: string;
}

export interface OBDDiagnosticRecord {
  id: string;
  bookingId: string;
  vehicleId: string;
  mechanicId: string;
  mechanicName?: string;
  faultCode: string;
  systemCategory: 'POWERTRAIN' | 'EMISSIONS' | 'BRAKES' | 'ELECTRICAL' | 'TRANSMISSION' | 'SUSPENSION' | 'HVAC';
  problemDescription: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedSolution: string;
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
}

export interface RepairInspectionReport {
  id: string;
  bookingId: string;
  vehicleId: string;
  mechanicId: string;
  mechanicName?: string;
  engineHealthScore: number;
  batteryVoltage: string;
  batteryHealthPercent: number;
  brakeWearPercent: number;
  tireCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REPLACE_SOON';
  tireTreadDepthMm: number;
  overallResult: 'PASS' | 'ATTENTION' | 'CRITICAL_FAIL';
  items: Array<{
    id: string;
    name: string;
    category: string;
    status: 'PASS' | 'ATTENTION' | 'FAIL';
    note: string;
  }>;
  summaryNotes: string;
  createdAt: string;
}

export interface RepairImageRecord {
  id: string;
  bookingId: string;
  vehicleId: string;
  uploadedBy: string;
  uploadedByName: string;
  category: 'BEFORE' | 'AFTER' | 'DIAGNOSTIC';
  imageUrl: string;
  caption: string;
  isApprovedForCustomer: boolean;
  createdAt: string;
}

export interface SparePartsRequestRecord {
  id: string;
  bookingId: string;
  vehicleId: string;
  mechanicId: string;
  mechanicName: string;
  partId: string;
  partName: string;
  partCode: string;
  quantityRequired: number;
  unitCost: number;
  totalCost: number;
  status: 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'INSTALLED' | 'REJECTED';
  urgency: 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  message: string;
  imageUrl?: string;
  type?: 'TEXT' | 'IMAGE' | 'APPROVAL_REQUEST' | 'SYSTEM';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  actionPayload?: any;
  createdAt: string;
}
