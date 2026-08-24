import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { calculateHaversineDistance, computeRecommendationScore, formatDistance } from '../utils/geoUtils';

export type Role = 'CUSTOMER' | 'ADMIN' | 'MECHANIC';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'ASSIGNED' | 'INSPECTION' | 'REPAIRING' | 'QUALITY_CHECK' | 'COMPLETED' | 'CANCELLED';
export type InvoiceStatus = 'UNPAID' | 'PAID';
export type ServiceCenterWorkingStatus = 'OPEN' | 'BUSY' | 'CLOSED';
export type MechanicAvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type OBDDiagnosticSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type OBDSystemCategory = 'POWERTRAIN' | 'EMISSIONS' | 'BRAKES' | 'ELECTRICAL' | 'TRANSMISSION' | 'SUSPENSION' | 'HVAC';
export type RepairImageCategory = 'BEFORE' | 'AFTER' | 'DIAGNOSTIC';
export type PartsRequestStatus = 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'INSTALLED' | 'REJECTED';

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

export interface NotificationRecord {
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

export interface ServiceCenterRecord {
  id: string;
  name: string;
  ownerId?: string | null;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phoneNumber?: string;
  averageRating: number;
  totalReviews: number;
  totalServicesCompleted: number;
  experienceYears: number;
  isVerified: boolean;
  workingStatus: ServiceCenterWorkingStatus;
  availableMechanics: number;
  specialties: string[];
  imageUrl?: string;
  totalRevenue?: number;
  totalActiveBookings?: number;
  averageResponseTime?: number; // in minutes
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  phone: string;
  role: Role;
  status?: 'ACTIVE' | 'SUSPENDED';
  availability?: MechanicAvailabilityStatus;
  assignedServiceCenterId?: string | null;
  shiftName?: string;
  badgeNumber?: string;
  experienceYears?: number;
  specialties?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRecord {
  id: string;
  ownerId: string;
  registrationNumber: string;
  brand: string;
  model: string;
  year: number;
  vehicleType: string;
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

export interface BookingRecord {
  id: string;
  vehicleId: string;
  customerId: string;
  mechanicId: string | null;
  assignedMechanicId?: string | null;
  assignedMechanicName?: string | null;
  serviceCenterId?: string | null;
  serviceType: string;
  issueDescription?: string;
  serviceDate?: string;
  preferredDate: string;
  status: BookingStatus;
  priority?: 'NORMAL' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedCost?: number;
  progressPercentage?: number;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReplacedPartItem {
  partName: string;
  partCode?: string;
  quantity: number;
  unitCost: number;
}

export interface RepairLogRecord {
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
}

export interface OBDDiagnosticRecord {
  id: string;
  bookingId: string;
  vehicleId: string;
  mechanicId: string;
  mechanicName?: string;
  faultCode: string;
  systemCategory: OBDSystemCategory;
  problemDescription: string;
  severity: OBDDiagnosticSeverity;
  recommendedSolution: string;
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
}

export interface InspectionChecklistItem {
  id: string;
  name: string;
  category: 'ENGINE' | 'BRAKES' | 'TIRES' | 'ELECTRICAL' | 'FLUIDS' | 'SUSPENSION' | 'EXHAUST';
  status: 'PASS' | 'ATTENTION' | 'FAIL';
  note: string;
}

export interface RepairInspectionRecord {
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
  items: InspectionChecklistItem[];
  summaryNotes: string;
  createdAt: string;
}

export interface RepairImageRecord {
  id: string;
  bookingId: string;
  vehicleId: string;
  uploadedBy: string;
  uploadedByName: string;
  category: RepairImageCategory;
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
  status: PartsRequestStatus;
  urgency: 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceRecord {
  id: string;
  bookingId: string;
  serviceCharges: number;
  partsCost: number;
  tax: number;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt: string | null;
}

export interface FeedbackRecord {
  id: string;
  bookingId: string;
  customerId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  performedBy: string; // userId or 'SYSTEM'
  performedByName?: string;
  performedByRole?: Role | 'SYSTEM';
  targetType: 'USER' | 'VEHICLE' | 'BOOKING' | 'INVOICE' | 'FEEDBACK' | 'MARKETPLACE' | 'SYSTEM';
  targetId?: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  createdAt: string;
}

export interface MarketplaceListingRecord {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR';
  vehicleType: string;
  description: string;
  verifiedByMechanic: boolean;
  verifierMechanicId?: string | null;
  verifierMechanicName?: string | null;
  sellerId: string;
  sellerName: string;
  sellerRole: Role;
  status: 'AVAILABLE' | 'PENDING_SALE' | 'SOLD';
  createdAt: string;
}

export interface MarketplaceInquiryRecord {
  id: string;
  listingId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  message: string;
  phone?: string;
  offerPrice?: number;
  createdAt: string;
}

export interface ChatMessageRecord {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  message: string;
  imageUrl?: string;
  type?: 'TEXT' | 'IMAGE' | 'APPROVAL_REQUEST' | 'REPAIR_UPDATE';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  actionPayload?: any;
  createdAt: string;
}

export interface PaymentTransactionRecord {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentMethod: 'UPI' | 'CARD' | 'RAZORPAY' | 'NET_BANKING';
  transactionRef: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: string;
  receiptUrl?: string;
}

export interface LoyaltyRecord {
  userId: string;
  points: number;
  lifetimePoints: number;
  redeemedPoints: number;
  updatedAt: string;
}

export interface CustomerPreferenceRecord {
  userId: string;
  emailAlerts: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;
  marketingAlerts: boolean;
  preferredGarageId?: string;
}

export interface ServiceInventoryRecord {
  id: string;
  name: string;
  category: 'PERIODIC_MAINTENANCE' | 'BRAKE_SYSTEM' | 'ENGINE_DIAGNOSTICS' | 'ELECTRICAL_EV' | 'TRANSMISSION' | 'TYRES_SUSPENSION' | 'BODY_COATING';
  code: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  usedInJobsCount: number;
  estimatedDurationMins: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  description: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  vehicles: VehicleRecord[];
  bookings: BookingRecord[];
  repairLogs: RepairLogRecord[];
  invoices: InvoiceRecord[];
  feedbacks: FeedbackRecord[];
  auditLogs: AuditLogRecord[];
  marketplaceListings: MarketplaceListingRecord[];
  marketplaceInquiries: MarketplaceInquiryRecord[];
  serviceCenters: ServiceCenterRecord[];
  notifications: NotificationRecord[];
  chatMessages: ChatMessageRecord[];
  paymentTransactions: PaymentTransactionRecord[];
  loyaltyRecords: LoyaltyRecord[];
  customerPreferences: CustomerPreferenceRecord[];
  servicesInventory?: ServiceInventoryRecord[];
  diagnostics?: OBDDiagnosticRecord[];
  inspections?: RepairInspectionRecord[];
  repairImages?: RepairImageRecord[];
  sparePartsRequests?: SparePartsRequestRecord[];
}

class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    vehicles: [],
    bookings: [],
    repairLogs: [],
    invoices: [],
    feedbacks: [],
    auditLogs: [],
    marketplaceListings: [],
    marketplaceInquiries: [],
    serviceCenters: [],
    notifications: [],
    chatMessages: [],
    paymentTransactions: [],
    loyaltyRecords: [],
    customerPreferences: [],
    servicesInventory: [],
    diagnostics: [],
    inspections: [],
    repairImages: [],
    sparePartsRequests: []
  };

  constructor() {
    this.seedSystemUsers();
  }

  private init() {
    this.seedSystemUsers();
  }

  private save() {
    // In-memory operation - file persistence to dev.db.json removed in favor of Firestore
  }

  public clearAllData() {
    this.data = {
      users: [],
      vehicles: [],
      bookings: [],
      repairLogs: [],
      invoices: [],
      feedbacks: [],
      auditLogs: [],
      marketplaceListings: [],
      marketplaceInquiries: [],
      serviceCenters: [],
      notifications: [],
      chatMessages: [],
      paymentTransactions: [],
      loyaltyRecords: [],
      customerPreferences: [],
      servicesInventory: [],
      diagnostics: [],
      inspections: [],
      repairImages: [],
      sparePartsRequests: []
    };
    this.seedSystemUsers();
  }

  private seedSystemUsers() {
    const passwordHash = bcrypt.hashSync('Password123!', 10);
    const now = new Date().toISOString();

    const adminUser: UserRecord = {
      id: 'usr-admin-1',
      name: 'System Administrator',
      email: 'admin@fleetops.com',
      password: passwordHash,
      phone: '+1-555-0100',
      role: 'ADMIN',
      createdAt: now,
      updatedAt: now
    };

    const customerUser: UserRecord = {
      id: 'usr-customer-1',
      name: 'Jordan Miller',
      email: 'customer@fleetops.com',
      password: passwordHash,
      phone: '+1-555-0199',
      role: 'CUSTOMER',
      createdAt: now,
      updatedAt: now
    };

    const mechanicUser: UserRecord = {
      id: 'usr-mech-1',
      name: 'Alex Rivera',
      email: 'mechanic@fleetops.com',
      password: passwordHash,
      phone: '+1-555-0155',
      role: 'MECHANIC',
      createdAt: now,
      updatedAt: now
    };

    this.data.users = [adminUser, customerUser, mechanicUser];
    this.data.vehicles = [];
    this.data.bookings = [];
    this.data.repairLogs = [];
    this.data.invoices = [];
    this.data.feedbacks = [];
    this.data.auditLogs = [];
    this.data.marketplaceListings = [];
    this.data.marketplaceInquiries = [];
    this.data.serviceCenters = [];
    this.data.notifications = [];
    this.data.chatMessages = [];
    this.data.paymentTransactions = [];
    this.data.loyaltyRecords = [];
    this.data.customerPreferences = [];
    this.data.servicesInventory = [];

    this.save();
  }

  public ensureStandardAccounts() {
    const passwordHash = bcrypt.hashSync('Password123!', 10);
    const now = new Date().toISOString();

    const standardUsers: UserRecord[] = [
      {
        id: 'usr-admin-1',
        name: 'System Administrator',
        email: 'admin@fleetops.com',
        password: passwordHash,
        phone: '+1-555-0100',
        role: 'ADMIN',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'usr-customer-1',
        name: 'Jordan Miller',
        email: 'customer@fleetops.com',
        password: passwordHash,
        phone: '+1-555-0199',
        role: 'CUSTOMER',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'usr-mech-1',
        name: 'Alex Rivera',
        email: 'mechanic@fleetops.com',
        password: passwordHash,
        phone: '+1-555-0155',
        role: 'MECHANIC',
        createdAt: now,
        updatedAt: now
      }
    ];

    let modified = false;
    for (const stdUser of standardUsers) {
      const idx = this.data.users.findIndex((u) => u.email.toLowerCase() === stdUser.email.toLowerCase());
      if (idx === -1) {
        this.data.users.push(stdUser);
        modified = true;
      }
    }

    if (modified) {
      this.save();
    }
  }

  public getInitialServiceCenters(): ServiceCenterRecord[] {
    return [];
  }

  // --- USER API ---
  getUsers() {
    return this.data.users;
  }

  getUserById(id: string) {
    return this.data.users.find((u) => u.id === id) || null;
  }

  getUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  createUser(user: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newUser: UserRecord = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id: string, updates: Partial<Omit<UserRecord, 'id' | 'createdAt'>>) {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const existing = this.data.users[index];
    const updated: UserRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.users[index] = updated;
    this.save();
    return updated;
  }

  deleteUser(id: string) {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.data.users.splice(index, 1);

    // Cascading deletion for user's vehicles and bookings
    const userVehicleIds = this.data.vehicles.filter((v) => v.ownerId === id).map((v) => v.id);
    this.data.vehicles = this.data.vehicles.filter((v) => v.ownerId !== id);

    const deletedBookingIds = this.data.bookings
      .filter((b) => b.customerId === id || userVehicleIds.includes(b.vehicleId))
      .map((b) => b.id);

    this.data.bookings = this.data.bookings.filter((b) => b.customerId !== id && !userVehicleIds.includes(b.vehicleId));
    this.data.repairLogs = this.data.repairLogs.filter((rl) => !deletedBookingIds.includes(rl.bookingId));
    this.data.invoices = this.data.invoices.filter((inv) => !deletedBookingIds.includes(inv.bookingId));

    this.save();
    return true;
  }

  // --- VEHICLE API ---
  getVehicles() {
    return this.data.vehicles;
  }

  getVehicleById(id: string) {
    return this.data.vehicles.find((v) => v.id === id) || null;
  }

  getVehicleByRegNumber(reg: string) {
    return this.data.vehicles.find((v) => v.registrationNumber.toUpperCase() === reg.toUpperCase()) || null;
  }

  getVehiclesByOwner(ownerId: string) {
    return this.data.vehicles.filter((v) => v.ownerId === ownerId);
  }

  createVehicle(vehicle: Omit<VehicleRecord, 'id' | 'createdAt'>) {
    const defaultMileage = vehicle.mileage !== undefined ? Number(vehicle.mileage) : Math.floor(25000 + Math.random() * 50000);
    const serviceIntervalMonths = vehicle.serviceIntervalMonths ?? 6;
    const serviceIntervalMileage = vehicle.serviceIntervalMileage ?? 5000;
    const avgMonthlyMileage = vehicle.avgMonthlyMileage ?? 1000;
    const lastServiceMileage = vehicle.lastServiceMileage ?? Math.max(0, defaultMileage - Math.floor(serviceIntervalMileage * 0.7));
    const nextMaintenanceMileage = vehicle.nextMaintenanceMileage ?? (lastServiceMileage + serviceIntervalMileage);

    const now = new Date();
    // Default last service date roughly 5 months ago so it naturally enters the 30-day window
    const defaultLastServiceDate = vehicle.lastServiceDate ?? new Date(now.getTime() - (serviceIntervalMonths - 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Default next service due date in 25-30 days
    const futureDate = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
    const defaultNextServiceDueDate = vehicle.nextServiceDueDate ?? futureDate.toISOString().split('T')[0];

    const newVehicle: VehicleRecord = {
      mileage: defaultMileage,
      lastServiceMileage,
      nextMaintenanceMileage,
      serviceIntervalMonths,
      serviceIntervalMileage,
      avgMonthlyMileage,
      lastServiceDate: defaultLastServiceDate,
      nextServiceDueDate: defaultNextServiceDueDate,
      recurringReminderEnabled: vehicle.recurringReminderEnabled ?? true,
      reminderStatus: 'DUE_SOON',
      serviceReminderNotes: vehicle.serviceReminderNotes || 'Periodic Maintenance & Multi-Point Inspection',
      ...vehicle,
      id: `veh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      registrationNumber: vehicle.registrationNumber.toUpperCase(),
      createdAt: new Date().toISOString()
    };
    this.data.vehicles.push(newVehicle);
    this.save();
    return newVehicle;
  }

  updateVehicle(id: string, updates: Partial<Omit<VehicleRecord, 'id' | 'ownerId' | 'createdAt'>>) {
    const idx = this.data.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    const existing = this.data.vehicles[idx];
    const updated = { ...existing, ...updates };
    if (updates.registrationNumber) {
      updated.registrationNumber = updates.registrationNumber.toUpperCase();
    }
    this.data.vehicles[idx] = updated;
    this.save();
    return updated;
  }

  updateVehicleMileage(id: string, newMileage: number) {
    const idx = this.data.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    const vehicle = this.data.vehicles[idx];
    vehicle.mileage = Number(newMileage);
    this.data.vehicles[idx] = vehicle;
    this.save();
    return vehicle;
  }

  recordVehicleServiceCompletion(vehicleId: string, completionDate?: string, completionMileage?: number) {
    const idx = this.data.vehicles.findIndex((v) => v.id === vehicleId);
    if (idx === -1) return null;
    const vehicle = this.data.vehicles[idx];

    const actualDate = completionDate || new Date().toISOString().split('T')[0];
    const actualMileage = completionMileage !== undefined ? Number(completionMileage) : (vehicle.mileage || 0);

    const monthsInterval = vehicle.serviceIntervalMonths || 6;
    const mileageInterval = vehicle.serviceIntervalMileage || 5000;

    const nextDueDate = new Date(new Date(actualDate).getTime() + monthsInterval * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextMileage = actualMileage + mileageInterval;

    vehicle.lastServiceDate = actualDate;
    vehicle.lastServiceMileage = actualMileage;
    vehicle.mileage = Math.max(vehicle.mileage || 0, actualMileage);
    vehicle.nextServiceDueDate = nextDueDate;
    vehicle.nextMaintenanceMileage = nextMileage;
    vehicle.lastReminderSentAt = undefined;
    vehicle.reminderStatus = 'OK';

    this.data.vehicles[idx] = vehicle;
    this.save();
    return vehicle;
  }

  deleteVehicle(id: string) {
    const idx = this.data.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    this.data.vehicles.splice(idx, 1);

    const deletedBookingIds = this.data.bookings.filter((b) => b.vehicleId === id).map((b) => b.id);
    this.data.bookings = this.data.bookings.filter((b) => b.vehicleId !== id);
    this.data.repairLogs = this.data.repairLogs.filter((rl) => !deletedBookingIds.includes(rl.bookingId));
    this.data.invoices = this.data.invoices.filter((inv) => !deletedBookingIds.includes(inv.bookingId));

    this.save();
    return true;
  }

  // --- BOOKING API ---
  getBookings() {
    return this.data.bookings;
  }

  getBookingById(id: string) {
    return this.data.bookings.find((b) => b.id === id) || null;
  }

  getBookingsByCustomer(customerId: string) {
    return this.data.bookings.filter((b) => b.customerId === customerId);
  }

  getBookingsByMechanic(mechanicId: string) {
    return this.data.bookings.filter((b) => b.mechanicId === mechanicId || b.assignedMechanicId === mechanicId);
  }

  getBookingsByVehicle(vehicleId: string) {
    return this.data.bookings.filter((b) => b.vehicleId === vehicleId);
  }

  createBooking(booking: Omit<BookingRecord, 'id' | 'createdAt' | 'updatedAt' | 'mechanicId' | 'status'> & Partial<Pick<BookingRecord, 'mechanicId' | 'assignedMechanicId' | 'assignedMechanicName' | 'serviceDate' | 'issueDescription'>>) {
    const now = new Date().toISOString();
    const prefDate = booking.preferredDate || booking.serviceDate || now;
    const newBooking: BookingRecord = {
      ...booking,
      id: `BK-${Math.floor(100 + Math.random() * 900)}`,
      mechanicId: booking.mechanicId || booking.assignedMechanicId || null,
      assignedMechanicId: booking.assignedMechanicId || booking.mechanicId || null,
      assignedMechanicName: booking.assignedMechanicName || null,
      serviceDate: booking.serviceDate || prefDate,
      preferredDate: prefDate,
      issueDescription: booking.issueDescription || booking.serviceType,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now
    };
    this.data.bookings.push(newBooking);
    this.save();
    return newBooking;
  }

  updateBooking(id: string, updates: Partial<BookingRecord>): BookingRecord | null {
    const idx = this.data.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const existing = this.data.bookings[idx];
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.data.bookings[idx] = updated;
    this.save();
    return updated;
  }

  updateBookingStatus(id: string, status: BookingStatus, mechanicId?: string | null, mechanicName?: string | null) {
    const idx = this.data.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const existing = this.data.bookings[idx];
    existing.status = status;
    if (mechanicId !== undefined) {
      existing.mechanicId = mechanicId;
      existing.assignedMechanicId = mechanicId;
      if (mechanicName) {
        existing.assignedMechanicName = mechanicName;
      } else if (mechanicId) {
        const mech = this.getUserById(mechanicId);
        existing.assignedMechanicName = mech?.name || null;
      } else {
        existing.assignedMechanicName = null;
      }
    }
    existing.updatedAt = new Date().toISOString();
    this.data.bookings[idx] = existing;
    this.save();
    return existing;
  }

  assignMechanicToBooking(id: string, mechanicId: string) {
    const mechanic = this.getUserById(mechanicId);
    return this.updateBookingStatus(id, 'ASSIGNED', mechanicId, mechanic?.name);
  }

  deleteBooking(id: string) {
    const idx = this.data.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.data.bookings.splice(idx, 1);
    this.data.repairLogs = this.data.repairLogs.filter((rl) => rl.bookingId !== id);
    this.data.invoices = this.data.invoices.filter((inv) => inv.bookingId !== id);
    this.save();
    return true;
  }

  deleteAllBookings() {
    this.data.bookings = [];
    this.data.repairLogs = [];
    this.data.invoices = [];
    this.save();
    return true;
  }

  // --- REPAIR LOG API ---
  getRepairLogsByBooking(bookingId: string) {
    return this.data.repairLogs.filter((rl) => rl.bookingId === bookingId);
  }

  addRepairLog(bookingId: string, note: string, updatedBy: string) {
    const newLog: RepairLogRecord = {
      id: `rl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId,
      note,
      updatedBy,
      createdAt: new Date().toISOString()
    };
    this.data.repairLogs.push(newLog);
    this.save();
    return newLog;
  }

  // --- INVOICE API ---
  getInvoices() {
    return this.data.invoices;
  }

  getInvoiceById(id: string) {
    return this.data.invoices.find((i) => i.id === id) || null;
  }

  getInvoiceByBookingId(bookingId: string) {
    return this.data.invoices.find((i) => i.bookingId === bookingId) || null;
  }

  createInvoice(bookingId: string, serviceCharges: number, partsCost: number, tax: number) {
    const amount = Number((serviceCharges + partsCost + tax).toFixed(2));
    const newInvoice: InvoiceRecord = {
      id: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      bookingId,
      serviceCharges,
      partsCost,
      tax,
      amount,
      status: 'UNPAID',
      issuedAt: new Date().toISOString(),
      paidAt: null
    };
    this.data.invoices.push(newInvoice);
    this.save();
    return newInvoice;
  }

  payInvoice(id: string) {
    const idx = this.data.invoices.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.data.invoices[idx].status = 'PAID';
    this.data.invoices[idx].paidAt = new Date().toISOString();
    this.save();
    return this.data.invoices[idx];
  }

  updateInvoice(id: string, updates: Partial<InvoiceRecord>): InvoiceRecord | null {
    const idx = this.data.invoices.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const existing = this.data.invoices[idx];
    const updated = { ...existing, ...updates };
    if (updates.serviceCharges !== undefined || updates.partsCost !== undefined || updates.tax !== undefined) {
      const sc = updates.serviceCharges !== undefined ? updates.serviceCharges : existing.serviceCharges;
      const pc = updates.partsCost !== undefined ? updates.partsCost : existing.partsCost;
      const tx = updates.tax !== undefined ? updates.tax : existing.tax;
      updated.amount = Number((sc + pc + tx).toFixed(2));
    }
    this.data.invoices[idx] = updated;
    this.save();
    return updated;
  }

  // --- FEEDBACK API ---
  getFeedbacks() {
    return this.data.feedbacks;
  }

  getFeedbackByBooking(bookingId: string) {
    return this.data.feedbacks.find((f) => f.bookingId === bookingId) || null;
  }

  getFeedbacksByCustomer(customerId: string) {
    return this.data.feedbacks.filter((f) => f.customerId === customerId);
  }

  createFeedback(bookingId: string, customerId: string, rating: number, comment: string) {
    const newFeedback: FeedbackRecord = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId,
      customerId,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };
    this.data.feedbacks.push(newFeedback);
    this.save();
    return newFeedback;
  }

  getMechanicAverageRating(mechanicId: string) {
    const mechanicCompletedBookings = this.data.bookings
      .filter((b) => b.mechanicId === mechanicId && b.status === 'COMPLETED')
      .map((b) => b.id);

    if (mechanicCompletedBookings.length === 0) {
      return { count: 0, averageRating: 0 };
    }

    const mechanicFeedbacks = this.data.feedbacks.filter((f) =>
      mechanicCompletedBookings.includes(f.bookingId)
    );

    if (mechanicFeedbacks.length === 0) {
      return { count: 0, averageRating: 0 };
    }

    const total = mechanicFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const avg = Number((total / mechanicFeedbacks.length).toFixed(1));
    return { count: mechanicFeedbacks.length, averageRating: avg };
  }

  // --- AUDIT LOG API ---
  getAuditLogs() {
    return (this.data.auditLogs || []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addAuditLog(entry: Omit<AuditLogRecord, 'id' | 'createdAt'>) {
    if (!this.data.auditLogs) this.data.auditLogs = [];
    const newLog: AuditLogRecord = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...entry
    };
    this.data.auditLogs.unshift(newLog);
    // Keep max 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
    return newLog;
  }

  // --- MARKETPLACE API ---
  getMarketplaceListings() {
    return this.data.marketplaceListings || [];
  }

  getMarketplaceListingById(id: string) {
    return (this.data.marketplaceListings || []).find((m) => m.id === id) || null;
  }

  createMarketplaceListing(listing: Omit<MarketplaceListingRecord, 'id' | 'createdAt'>) {
    if (!this.data.marketplaceListings) this.data.marketplaceListings = [];
    const newListing: MarketplaceListingRecord = {
      ...listing,
      id: `mkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.data.marketplaceListings.unshift(newListing);
    this.save();
    return newListing;
  }

  getInquiries(listingId?: string) {
    if (!this.data.marketplaceInquiries) this.data.marketplaceInquiries = [];
    if (listingId) {
      return this.data.marketplaceInquiries.filter((i) => i.listingId === listingId);
    }
    return this.data.marketplaceInquiries;
  }

  createInquiry(inquiry: Omit<MarketplaceInquiryRecord, 'id' | 'createdAt'>) {
    if (!this.data.marketplaceInquiries) this.data.marketplaceInquiries = [];
    const newInquiry: MarketplaceInquiryRecord = {
      ...inquiry,
      id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.data.marketplaceInquiries.unshift(newInquiry);
    this.save();
    return newInquiry;
  }

  // --- ANALYTICS SUMMARY ---
  getAnalyticsSummary() {
    const totalUsers = this.data.users.length;
    const totalMechanics = this.data.users.filter((u) => u.role === 'MECHANIC').length;
    const totalCustomers = this.data.users.filter((u) => u.role === 'CUSTOMER').length;
    const totalAdmins = this.data.users.filter((u) => u.role === 'ADMIN').length;
    const totalVehicles = this.data.vehicles.length;
    const totalBookings = this.data.bookings.length;
    const pendingRequests = this.data.bookings.filter((b) => b.status === 'PENDING').length;
    const activeRepairs = this.data.bookings.filter((b) => b.status === 'REPAIRING' || b.status === 'ASSIGNED').length;
    const completedServices = this.data.bookings.filter((b) => b.status === 'COMPLETED').length;

    const totalRevenue = this.data.invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.amount, 0);

    const pendingRevenue = this.data.invoices
      .filter((i) => i.status === 'UNPAID')
      .reduce((sum, i) => sum + i.amount, 0);

    const mechanicWorkload = this.data.users
      .filter((u) => u.role === 'MECHANIC')
      .map((mech) => {
        const assigned = this.data.bookings.filter((b) => b.mechanicId === mech.id);
        const inProgress = assigned.filter((b) => b.status === 'REPAIRING' || b.status === 'ASSIGNED').length;
        const completed = assigned.filter((b) => b.status === 'COMPLETED').length;
        const rating = this.getMechanicAverageRating(mech.id);
        return {
          id: mech.id,
          name: mech.name,
          email: mech.email,
          phone: mech.phone,
          activeJobs: inProgress,
          completedJobs: completed,
          averageRating: rating.averageRating,
          reviewCount: rating.count
        };
      });

    return {
      totalUsers,
      totalMechanics,
      totalCustomers,
      totalAdmins,
      totalVehicles,
      totalBookings,
      pendingRequests,
      activeRepairs,
      completedServices,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      pendingRevenue: Number(pendingRevenue.toFixed(2)),
      mechanicWorkload
    };
  }

  // --- NOTIFICATION API ---
  getUserNotifications(userId: string): NotificationRecord[] {
    if (!this.data.notifications) this.data.notifications = [];
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getNotificationById(id: string): NotificationRecord | null {
    if (!this.data.notifications) this.data.notifications = [];
    return this.data.notifications.find((n) => n.id === id) || null;
  }

  createNotification(
    data: Omit<NotificationRecord, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean; createdAt?: string }
  ): NotificationRecord {
    if (!this.data.notifications) this.data.notifications = [];
    const newNotif: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: data.isRead ?? false,
      link: data.link,
      data: data.data,
      createdAt: data.createdAt || new Date().toISOString()
    };
    this.data.notifications.unshift(newNotif);
    // Cap at 1000 notifications
    if (this.data.notifications.length > 1000) {
      this.data.notifications = this.data.notifications.slice(0, 1000);
    }
    this.save();
    return newNotif;
  }

  markNotificationAsRead(id: string, userId?: string): NotificationRecord | null {
    if (!this.data.notifications) this.data.notifications = [];
    const notif = this.data.notifications.find(
      (n) => n.id === id && (!userId || n.userId === userId)
    );
    if (!notif) return null;
    notif.isRead = true;
    this.save();
    return notif;
  }

  markAllNotificationsAsRead(userId: string): number {
    if (!this.data.notifications) this.data.notifications = [];
    let count = 0;
    this.data.notifications.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    if (count > 0) {
      this.save();
    }
    return count;
  }

  deleteNotification(id: string, userId?: string): boolean {
    if (!this.data.notifications) return false;
    const index = this.data.notifications.findIndex(
      (n) => n.id === id && (!userId || n.userId === userId)
    );
    if (index === -1) return false;
    this.data.notifications.splice(index, 1);
    this.save();
    return true;
  }

  // --- SERVICE CENTER ANALYTICS ---
  getServiceCenterAnalytics(centerId: string) {
    const center = this.getServiceCenterById(centerId);
    if (!center) return null;

    const centerBookings = this.data.bookings.filter((b) => b.serviceCenterId === centerId);
    const completedBookings = centerBookings.filter((b) => b.status === 'COMPLETED');
    const activeBookings = centerBookings.filter(
      (b) => b.status === 'REPAIRING' || b.status === 'ASSIGNED' || b.status === 'APPROVED' || b.status === 'PENDING'
    );

    // Calculate revenue from invoices of completed center bookings or estimated from completedServices
    const centerInvoiceIds = completedBookings.map((b) => b.id);
    const invoiceRevenue = this.data.invoices
      .filter((i) => centerInvoiceIds.includes(i.bookingId) && i.status === 'PAID')
      .reduce((sum, i) => sum + i.amount, 0);

    const baseRevenue = center.totalRevenue ?? Math.max(invoiceRevenue, center.totalServicesCompleted * 145);
    const monthlyRevenue = Number((baseRevenue * 0.18).toFixed(2));

    const totalServices = center.totalServicesCompleted + centerBookings.length;
    const customerSatisfaction = Math.min(99, Math.round((center.averageRating / 5.0) * 100));

    // Dynamic 6-month growth trend
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const monthlyServiceGrowth = months.map((month, idx) => {
      const multiplier = 0.65 + idx * 0.08;
      const count = Math.round((center.totalServicesCompleted / 6) * multiplier);
      return {
        month,
        services: count + Math.floor(Math.random() * 8),
        completed: Math.round(count * 0.92)
      };
    });

    const revenueGrowth = months.map((month, idx) => {
      const rev = Math.round((monthlyRevenue * (0.7 + idx * 0.09)));
      const parts = Math.round(rev * 0.38);
      return {
        month,
        revenue: rev,
        partsCost: parts,
        profit: rev - parts
      };
    });

    const ratingTrend = months.map((month, idx) => {
      const base = center.averageRating - 0.2 + idx * 0.04;
      return {
        month,
        rating: Number(Math.min(5.0, Math.max(4.0, base)).toFixed(2)),
        reviewsCount: Math.round((center.totalReviews / 6) * (0.8 + idx * 0.06))
      };
    });

    const statusCounts = {
      Completed: completedBookings.length || Math.round(center.totalServicesCompleted * 0.75),
      'In Progress': activeBookings.filter((b) => b.status === 'REPAIRING').length || 4,
      Assigned: activeBookings.filter((b) => b.status === 'ASSIGNED').length || 3,
      Pending: activeBookings.filter((b) => b.status === 'PENDING').length || 2
    };

    const bookingStatusDistribution = [
      { name: 'Completed', value: statusCounts.Completed, color: '#10b981' },
      { name: 'In Progress', value: statusCounts['In Progress'], color: '#3b82f6' },
      { name: 'Assigned', value: statusCounts.Assigned, color: '#f59e0b' },
      { name: 'Pending', value: statusCounts.Pending, color: '#8b5cf6' }
    ];

    return {
      center,
      summary: {
        totalServices,
        completedServices: center.totalServicesCompleted,
        activeBookings: activeBookings.length || center.totalActiveBookings || 5,
        totalRevenue: Number(baseRevenue.toFixed(2)),
        monthlyRevenue,
        averageRating: center.averageRating,
        customerSatisfaction,
        avgResponseMinutes: center.averageResponseTime || 14,
        mechanicUtilization: Math.min(96, Math.round(75 + (center.availableMechanics ? (8 / center.availableMechanics) * 10 : 12)))
      },
      monthlyServiceGrowth,
      revenueGrowth,
      ratingTrend,
      bookingStatusDistribution
    };
  }

  // --- SERVICE CENTER API & RECOMMENDATION ENGINE ---
  getServiceCenters(): ServiceCenterRecord[] {
    return this.data.serviceCenters || [];
  }

  getServiceCenterById(id: string): ServiceCenterRecord | null {
    return (this.data.serviceCenters || []).find((sc) => sc.id === id) || null;
  }

  createServiceCenter(
    center: Omit<ServiceCenterRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalServicesCompleted' | 'averageRating' | 'totalReviews'> & {
      averageRating?: number;
      totalReviews?: number;
      totalServicesCompleted?: number;
    }
  ): ServiceCenterRecord {
    const now = new Date().toISOString();
    const newCenter: ServiceCenterRecord = {
      ...center,
      id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      averageRating: center.averageRating ?? 4.8,
      totalReviews: center.totalReviews ?? 12,
      totalServicesCompleted: center.totalServicesCompleted ?? 45,
      experienceYears: center.experienceYears ?? 5,
      isVerified: center.isVerified ?? false,
      workingStatus: center.workingStatus ?? 'OPEN',
      availableMechanics: center.availableMechanics ?? 3,
      specialties: center.specialties ?? ['General Maintenance', 'Oil & Brakes'],
      createdAt: now,
      updatedAt: now
    };
    if (!this.data.serviceCenters) {
      this.data.serviceCenters = [];
    }
    this.data.serviceCenters.push(newCenter);
    this.save();
    return newCenter;
  }

  updateServiceCenter(id: string, updates: Partial<Omit<ServiceCenterRecord, 'id' | 'createdAt'>>): ServiceCenterRecord | null {
    if (!this.data.serviceCenters) return null;
    const idx = this.data.serviceCenters.findIndex((sc) => sc.id === id);
    if (idx === -1) return null;
    const updated: ServiceCenterRecord = {
      ...this.data.serviceCenters[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.serviceCenters[idx] = updated;
    this.save();
    return updated;
  }

  verifyServiceCenter(id: string, isVerified: boolean = true): ServiceCenterRecord | null {
    return this.updateServiceCenter(id, { isVerified });
  }

  updateServiceCenterWorkingStatus(id: string, workingStatus: ServiceCenterWorkingStatus, availableMechanics?: number): ServiceCenterRecord | null {
    const updates: Partial<ServiceCenterRecord> = { workingStatus };
    if (availableMechanics !== undefined) {
      updates.availableMechanics = availableMechanics;
    }
    return this.updateServiceCenter(id, updates);
  }

  deleteServiceCenter(id: string): boolean {
    if (!this.data.serviceCenters) return false;
    const idx = this.data.serviceCenters.findIndex((sc) => sc.id === id);
    if (idx === -1) return false;
    this.data.serviceCenters.splice(idx, 1);
    this.save();
    return true;
  }

  /**
   * Find nearby service centers from a user's coordinate within radiusKm
   */
  getNearbyServiceCenters(lat: number, lon: number, radiusKm: number = 50) {
    const centers = this.getServiceCenters();
    return centers
      .map((center) => {
        const distanceKm = calculateHaversineDistance(lat, lon, center.latitude, center.longitude);
        return {
          ...center,
          distanceKm,
          distanceText: formatDistance(distanceKm)
        };
      })
      .filter((center) => radiusKm <= 0 || center.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Advanced Smart Recommendation Algorithm
   * Formula: (40% Rating) + (30% Distance) + (20% Completed Services) + (10% Experience)
   */
  getRecommendedServiceCenters(lat: number, lon: number, radiusKm: number = 50) {
    const nearby = this.getNearbyServiceCenters(lat, lon, radiusKm);
    
    // If empty within strict radius, fallback to all available service centers sorted by distance
    const listToRank = nearby.length > 0 ? nearby : this.getNearbyServiceCenters(lat, lon, 0);

    const scored = listToRank.map((center) => {
      const scoreData = computeRecommendationScore({
        rating: center.averageRating,
        distanceKm: center.distanceKm,
        maxRadiusKm: radiusKm > 0 ? radiusKm : 50,
        totalServicesCompleted: center.totalServicesCompleted,
        experienceYears: center.experienceYears,
        isVerified: center.isVerified
      });

      return {
        ...center,
        recommendationScore: scoreData.totalScore,
        recommendationReasons: scoreData.reasons,
        scoreBreakdown: {
          ratingScore: scoreData.ratingScore,
          distanceScore: scoreData.distanceScore,
          completedServicesScore: scoreData.completedServicesScore,
          experienceScore: scoreData.experienceScore,
          total: scoreData.totalScore
        },
        isBestChoice: false
      };
    });

    // Sort by recommendation score descending
    scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Designate the top 1 (if score > 0) as isBestChoice
    if (scored.length > 0) {
      scored[0].isBestChoice = true;
    }

    return scored;
  }

  // ================= CHAT SUBSYSTEM =================
  getChatMessages(bookingId: string): ChatMessageRecord[] {
    if (!this.data.chatMessages) this.data.chatMessages = [];
    return this.data.chatMessages
      .filter((m) => m.bookingId === bookingId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addChatMessage(data: {
    bookingId: string;
    senderId: string;
    senderName: string;
    senderRole: Role;
    message: string;
    imageUrl?: string;
    type?: 'TEXT' | 'IMAGE' | 'APPROVAL_REQUEST' | 'REPAIR_UPDATE';
    approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    actionPayload?: any;
  }): ChatMessageRecord {
    if (!this.data.chatMessages) this.data.chatMessages = [];
    const msg: ChatMessageRecord = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: data.bookingId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      message: data.message,
      imageUrl: data.imageUrl,
      type: data.type || 'TEXT',
      approvalStatus: data.approvalStatus || (data.type === 'APPROVAL_REQUEST' ? 'PENDING' : undefined),
      actionPayload: data.actionPayload,
      createdAt: new Date().toISOString()
    };
    this.data.chatMessages.push(msg);
    this.save();
    return msg;
  }

  // ================= PAYMENT TRANSACTIONS =================
  createPaymentTransaction(data: {
    invoiceId: string;
    customerId: string;
    amount: number;
    paymentMethod: 'UPI' | 'CARD' | 'RAZORPAY' | 'NET_BANKING';
  }): { transaction: PaymentTransactionRecord; invoice: InvoiceRecord } {
    if (!this.data.paymentTransactions) this.data.paymentTransactions = [];
    const invoice = this.getInvoiceById(data.invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const paidInvoice = this.payInvoice(data.invoiceId);

    const transaction: PaymentTransactionRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      invoiceId: data.invoiceId,
      customerId: data.customerId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionRef: `REF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
      receiptUrl: `/api/customer/invoices/${data.invoiceId}/pdf`
    };

    this.data.paymentTransactions.push(transaction);

    // Award loyalty points: 1 point per $10 spent
    const earnedPoints = Math.max(10, Math.floor(data.amount / 10));
    this.awardLoyaltyPoints(data.customerId, earnedPoints);

    this.save();
    return { transaction, invoice: paidInvoice };
  }

  getPaymentTransactionsByCustomer(customerId: string): PaymentTransactionRecord[] {
    if (!this.data.paymentTransactions) this.data.paymentTransactions = [];
    return this.data.paymentTransactions
      .filter((t) => t.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ================= LOYALTY & REWARDS =================
  getLoyaltyRecord(userId: string): LoyaltyRecord {
    if (!this.data.loyaltyRecords) this.data.loyaltyRecords = [];
    let record = this.data.loyaltyRecords.find((l) => l.userId === userId);
    if (!record) {
      // Calculate initial based on completed services
      const completed = this.getBookingsByCustomer(userId).filter((b) => b.status === 'COMPLETED').length;
      const initialPoints = Math.max(250, completed * 200 + 150);
      record = {
        userId,
        points: initialPoints,
        lifetimePoints: initialPoints + 300,
        redeemedPoints: 300,
        updatedAt: new Date().toISOString()
      };
      this.data.loyaltyRecords.push(record);
      this.save();
    }
    return record;
  }

  awardLoyaltyPoints(userId: string, points: number) {
    const record = this.getLoyaltyRecord(userId);
    record.points += points;
    record.lifetimePoints += points;
    record.updatedAt = new Date().toISOString();
    this.save();
  }

  redeemCoupon(userId: string, code: string): { success: boolean; discountAmount: number; message: string } {
    const coupons: Record<string, { discountAmount: number; cost: number; title: string }> = {
      'FLEET10': { discountAmount: 10, cost: 200, title: '$10 Off Standard Service' },
      'FLEET25': { discountAmount: 25, cost: 500, title: '$25 Off Full Inspection' },
      'FLEET50': { discountAmount: 50, cost: 950, title: '$50 Off Brake & Engine Package' },
      'FREEWASH': { discountAmount: 15, cost: 300, title: 'Complimentary Pro Detail' }
    };

    const coupon = coupons[code.toUpperCase()];
    if (!coupon) {
      return { success: false, discountAmount: 0, message: 'Invalid coupon code.' };
    }

    const record = this.getLoyaltyRecord(userId);
    if (record.points < coupon.cost) {
      return { success: false, discountAmount: 0, message: `Insufficient reward points. Requires ${coupon.cost} pts (You have ${record.points} pts).` };
    }

    record.points -= coupon.cost;
    record.redeemedPoints += coupon.cost;
    record.updatedAt = new Date().toISOString();
    this.save();

    return {
      success: true,
      discountAmount: coupon.discountAmount,
      message: `Coupon ${code.toUpperCase()} successfully redeemed for $${coupon.discountAmount} discount!`
    };
  }

  getLoyaltyRewards(userId: string) {
    const record = this.getLoyaltyRecord(userId);
    const pts = record.points;

    let tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'BRONZE';
    let tierColor = 'text-amber-700 bg-amber-100 border-amber-300';
    let nextTierName = 'Silver Member';
    let nextTierPointsRemaining = Math.max(0, 1000 - pts);

    if (pts >= 3000) {
      tier = 'PLATINUM';
      tierColor = 'text-purple-700 bg-purple-100 border-purple-300';
      nextTierName = 'Max Tier Achieved';
      nextTierPointsRemaining = 0;
    } else if (pts >= 1500) {
      tier = 'GOLD';
      tierColor = 'text-amber-500 bg-amber-50 border-amber-300';
      nextTierName = 'Platinum Member';
      nextTierPointsRemaining = Math.max(0, 3000 - pts);
    } else if (pts >= 750) {
      tier = 'SILVER';
      tierColor = 'text-slate-600 bg-slate-100 border-slate-300';
      nextTierName = 'Gold Member';
      nextTierPointsRemaining = Math.max(0, 1500 - pts);
    }

    return {
      points: record.points,
      tier,
      tierColor,
      lifetimePoints: record.lifetimePoints,
      redeemedPoints: record.redeemedPoints,
      nextTierPointsRemaining,
      nextTierName,
      availableCoupons: [
        { code: 'FLEET10', title: '$10 Off Standard Service', discountAmount: 10, pointsCost: 200, minBillAmount: 50, expiresAt: '2026-12-31' },
        { code: 'FLEET25', title: '$25 Off Major Maintenance', discountAmount: 25, pointsCost: 500, minBillAmount: 100, expiresAt: '2026-12-31' },
        { code: 'FLEET50', title: '$50 Off Brake & Engine Package', discountAmount: 50, pointsCost: 950, minBillAmount: 200, expiresAt: '2026-12-31' },
        { code: 'FREEWASH', title: 'Complimentary Pro Detail Clean', discountAmount: 15, pointsCost: 300, minBillAmount: 30, expiresAt: '2026-12-31' }
      ]
    };
  }

  // ================= CUSTOMER PREFERENCES =================
  getCustomerPreferences(userId: string): CustomerPreferenceRecord {
    if (!this.data.customerPreferences) this.data.customerPreferences = [];
    let pref = this.data.customerPreferences.find((p) => p.userId === userId);
    if (!pref) {
      pref = {
        userId,
        emailAlerts: true,
        pushAlerts: true,
        smsAlerts: false,
        marketingAlerts: false
      };
      this.data.customerPreferences.push(pref);
      this.save();
    }
    return pref;
  }

  updateCustomerPreferences(userId: string, updates: Partial<CustomerPreferenceRecord>): CustomerPreferenceRecord {
    const pref = this.getCustomerPreferences(userId);
    Object.assign(pref, updates);
    this.save();
    return pref;
  }

  // ================= VEHICLE HEALTH & AI PREDICTIONS =================
  getVehicleHealth(vehicleId: string) {
    const v = this.getVehicleById(vehicleId);
    if (!v) return null;

    const mileage = v.mileage ?? 45000;
    const target = v.nextMaintenanceMileage ?? (mileage + 3000);
    const mileageDelta = Math.max(0, target - mileage);

    // Calculate score based on maintenance compliance & age
    const ageYears = Math.max(0, new Date().getFullYear() - v.year);
    let engineScore = Math.max(60, 95 - Math.floor(mileage / 15000) - (ageYears * 2));
    let brakeScore = Math.max(50, 92 - Math.floor((mileage % 25000) / 400));
    let oilScore = Math.max(40, Math.round((mileageDelta / 3000) * 100));
    let batteryScore = ageYears > 4 ? 74 : 94;
    let tyreScore = Math.max(65, 90 - Math.floor((mileage % 30000) / 500));

    if (v.reminderStatus === 'OVERDUE' || mileage >= target) {
      oilScore = Math.min(oilScore, 35);
      brakeScore = Math.min(brakeScore, 65);
      engineScore = Math.min(engineScore, 72);
    }

    const overallHealthScore = Math.round((engineScore * 0.3) + (brakeScore * 0.25) + (oilScore * 0.25) + (batteryScore * 0.1) + (tyreScore * 0.1));

    let healthStatus: 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';
    if (overallHealthScore < 65) healthStatus = 'CRITICAL';
    else if (overallHealthScore < 80) healthStatus = 'WARNING';

    // AI recommendation generation
    let aiRecommendation = `Vehicle ${v.brand} ${v.model} is running in optimal operational condition. All vital telemetry metrics are nominal.`;
    let predictedService = 'Routine Multi-point Inspection';
    let predictedServiceDays = 45;
    let predictedServiceMileage = mileage + 2500;

    if (oilScore < 50) {
      aiRecommendation = `AI Telemetry Alert: Engine oil viscosity has degraded past optimal thresholds. An engine oil and filter flush is recommended within 14 days.`;
      predictedService = 'Synthetic Engine Oil & Filter Change';
      predictedServiceDays = 14;
      predictedServiceMileage = mileage + 500;
    } else if (brakeScore < 70) {
      aiRecommendation = `AI Diagnostic Prediction: Brake pad thickness telemetry suggests wear exceeding 65%. Pad inspection and rotor check advised within 800 km.`;
      predictedService = 'Front & Rear Brake Pad Servicing';
      predictedServiceDays = 20;
      predictedServiceMileage = mileage + 800;
    } else if (batteryScore < 80) {
      aiRecommendation = `AI Battery Health Analysis: Cold cranking amps dropping slightly due to battery age (${ageYears} yrs). Test terminal voltage at next scheduled stop.`;
      predictedService = 'Electrical & Alternator Diagnostic';
      predictedServiceDays = 30;
      predictedServiceMileage = mileage + 1500;
    }

    const getStatus = (score: number): 'GOOD' | 'WARNING' | 'CRITICAL' => {
      if (score >= 80) return 'GOOD';
      if (score >= 65) return 'WARNING';
      return 'CRITICAL';
    };

    return {
      vehicleId: v.id,
      vehicleBrand: v.brand,
      vehicleModel: v.model,
      registrationNumber: v.registrationNumber,
      vehicleType: v.vehicleType,
      year: v.year,
      currentMileage: mileage,
      overallHealthScore,
      healthStatus,
      metrics: {
        engineHealth: {
          name: 'Engine Performance',
          score: engineScore,
          status: getStatus(engineScore),
          detail: engineScore > 85 ? 'Smooth combustion & normal thermal index' : 'Minor carbon build-up detected'
        },
        brakeCondition: {
          name: 'Braking System',
          score: brakeScore,
          status: getStatus(brakeScore),
          detail: brakeScore > 75 ? 'Optimal rotor friction & pad depth' : 'Pads worn; replacement in <800 km'
        },
        oilLife: {
          name: 'Engine Oil Life',
          score: oilScore,
          status: getStatus(oilScore),
          detail: `${oilScore}% life remaining based on driving telemetry`
        },
        batteryStatus: {
          name: '12V Electrical & Battery',
          score: batteryScore,
          status: getStatus(batteryScore),
          detail: batteryScore > 80 ? '12.6V nominal output, strong alternator' : 'Voltage fluctuation observed'
        },
        tyrePressure: {
          name: 'Tyre Pressure & Tread',
          score: tyreScore,
          status: getStatus(tyreScore),
          detail: 'All 4 tyres balanced (33-35 PSI)'
        }
      },
      aiRecommendation,
      predictedService,
      predictedServiceDays,
      predictedServiceMileage,
      lastUpdated: new Date().toISOString()
    };
  }

  getCustomerVehiclesHealth(customerId: string) {
    const vehicles = this.getVehiclesByOwner(customerId);
    return vehicles.map((v) => this.getVehicleHealth(v.id)).filter(Boolean);
  }

  // ================= CUSTOMER REMINDERS =================
  getCustomerReminders(customerId: string) {
    const vehicles = this.getVehiclesByOwner(customerId);
    const reminders: any[] = [];
    const now = new Date();

    vehicles.forEach((v) => {
      const mileage = v.mileage ?? 45000;
      const target = v.nextMaintenanceMileage ?? (mileage + 3000);
      const milesLeft = target - mileage;

      let daysLeft = 30;
      if (v.nextServiceDueDate) {
        const due = new Date(v.nextServiceDueDate);
        daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      if (milesLeft <= 500 || daysLeft <= 14) {
        reminders.push({
          id: `rem-oil-${v.id}`,
          vehicleId: v.id,
          vehicleName: `${v.brand} ${v.model}`,
          registrationNumber: v.registrationNumber,
          title: 'Engine Oil & Filter Service Due',
          description: daysLeft <= 0 ? 'Service is currently OVERDUE' : `Scheduled maintenance due in ${daysLeft} days or ${Math.max(0, milesLeft)} miles.`,
          type: 'OIL_CHANGE',
          dueDate: v.nextServiceDueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          dueMileage: target,
          daysRemaining: daysLeft,
          urgency: (daysLeft <= 0 || milesLeft <= 0) ? 'HIGH' : 'MEDIUM',
          status: 'ACTIVE'
        });
      }

      // Add Insurance & Pollution Certificate Reminders
      reminders.push({
        id: `rem-ins-${v.id}`,
        vehicleId: v.id,
        vehicleName: `${v.brand} ${v.model}`,
        registrationNumber: v.registrationNumber,
        title: 'Comprehensive Insurance Renewal',
        description: 'Policy expires in 45 days. Review coverage to avoid lapse.',
        type: 'INSURANCE_EXPIRY',
        dueDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
        daysRemaining: 45,
        urgency: 'LOW',
        status: 'ACTIVE'
      });
    });

    return reminders;
  }

  getInvoicesByCustomer(customerId: string): InvoiceRecord[] {
    const customerBookings = this.getBookingsByCustomer(customerId);
    const bookingIds = new Set(customerBookings.map((b) => b.id));
    return (this.data.invoices || []).filter((inv) => bookingIds.has(inv.bookingId));
  }

  // ================= CUSTOMER DASHBOARD AGGREGATION =================
  getCustomerDashboardData(customerId: string) {
    const user = this.getUserById(customerId);
    const vehicles = this.getVehiclesByOwner(customerId);
    const bookings = this.getBookingsByCustomer(customerId);
    const invoices = this.getInvoicesByCustomer(customerId);
    const vehicleHealthList = this.getCustomerVehiclesHealth(customerId);
    const reminders = this.getCustomerReminders(customerId);
    const rewards = this.getLoyaltyRewards(customerId);

    // Recommended garages
    const recommendedGarages = this.getRecommendedServiceCenters(28.6315, 77.2167, 30).slice(0, 3);

    const activeBookings = bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
    const completedServices = bookings.filter((b) => b.status === 'COMPLETED').length;

    const totalSpending = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + (i.amount || (i.serviceCharges + i.partsCost + i.tax)), 0);

    const pendingInvoicesAmount = invoices
      .filter((i) => i.status === 'UNPAID')
      .reduce((sum, i) => sum + (i.amount || (i.serviceCharges + i.partsCost + i.tax)), 0);

    return {
      customer: {
        id: customerId,
        name: user?.name || 'Valued Customer',
        email: user?.email || '',
        phone: user?.phone || '',
        membershipTier: rewards.tier,
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`
      },
      stats: {
        totalVehicles: vehicles.length,
        activeBookings: activeBookings.length,
        completedServices,
        totalSpending,
        pendingInvoicesAmount,
        rewardPoints: rewards.points
      },
      vehicleHealthList,
      activeBookings,
      upcomingReminders: reminders,
      recommendedGarages,
      rewards
    };
  }

  // ================= BOOKING CANCELLATION =================
  cancelBookingByCustomer(bookingId: string, customerId: string): { success: boolean; booking?: BookingRecord; message: string } {
    const booking = this.getBookingById(bookingId);
    if (!booking) {
      return { success: false, message: 'Booking not found.' };
    }
    if (booking.customerId !== customerId) {
      return { success: false, message: 'Unauthorized: You can only cancel your own bookings.' };
    }
    if (booking.status === 'REPAIRING' || booking.status === 'COMPLETED') {
      return {
        success: false,
        message: `Booking cannot be cancelled once status has progressed to ${booking.status}. Please contact support or your assigned technician.`
      };
    }
    if (booking.status === 'CANCELLED') {
      return { success: false, message: 'Booking is already cancelled.' };
    }

    const updated = this.updateBookingStatus(bookingId, 'CANCELLED');
    return {
      success: true,
      booking: updated || undefined,
      message: 'Booking cancelled successfully.'
    };
  }
  // ================= ENTERPRISE ADMIN INVENTORY & SERVICES =================
  getInitialServicesInventory(): ServiceInventoryRecord[] {
    return [];
  }

  getServicesInventory(): ServiceInventoryRecord[] {
    if (!this.data.servicesInventory) {
      this.data.servicesInventory = [];
    }
    return this.data.servicesInventory;
  }

  createServicesInventoryItem(item: Omit<ServiceInventoryRecord, 'id' | 'usedInJobsCount'>): ServiceInventoryRecord {
    if (!this.data.servicesInventory) this.data.servicesInventory = [];
    const newItem: ServiceInventoryRecord = {
      ...item,
      id: `srv-inv-${Date.now()}`,
      usedInJobsCount: 0,
      status: item.stockQuantity <= 0 ? 'OUT_OF_STOCK' : item.stockQuantity <= item.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK'
    };
    this.data.servicesInventory.unshift(newItem);
    this.save();
    return newItem;
  }

  updateServicesInventoryItem(id: string, updates: Partial<ServiceInventoryRecord>): ServiceInventoryRecord | null {
    if (!this.data.servicesInventory) return null;
    const idx = this.data.servicesInventory.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    const current = this.data.servicesInventory[idx];
    const updated: ServiceInventoryRecord = {
      ...current,
      ...updates
    };

    if (updated.stockQuantity <= 0) {
      updated.status = 'OUT_OF_STOCK';
    } else if (updated.stockQuantity <= updated.reorderLevel) {
      updated.status = 'LOW_STOCK';
    } else {
      updated.status = 'IN_STOCK';
    }

    this.data.servicesInventory[idx] = updated;
    this.save();
    return updated;
  }

  deleteServicesInventoryItem(id: string): boolean {
    if (!this.data.servicesInventory) return false;
    const prevLen = this.data.servicesInventory.length;
    this.data.servicesInventory = this.data.servicesInventory.filter((i) => i.id !== id);
    if (this.data.servicesInventory.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  // ================= ADMIN USER MANAGEMENT =================
  getAdminCustomers() {
    const customers = this.data.users.filter((u) => u.role === 'CUSTOMER');
    return customers.map((c) => {
      const vehicles = this.getVehiclesByOwner(c.id);
      const bookings = this.getBookingsByCustomer(c.id);
      const invoices = this.getInvoicesByCustomer(c.id);
      const totalSpent = invoices
        .filter((inv) => inv.status === 'PAID')
        .reduce((sum, inv) => sum + (inv.amount || (inv.serviceCharges + inv.partsCost + inv.tax)), 0);

      const loyalty = this.getLoyaltyRewards(c.id);

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        status: (c.status as 'ACTIVE' | 'SUSPENDED') || 'ACTIVE',
        membershipTier: loyalty.tier,
        totalVehicles: vehicles.length,
        totalBookings: bookings.length,
        completedBookings: bookings.filter((b) => b.status === 'COMPLETED').length,
        totalSpent,
        lastActive: c.updatedAt || c.createdAt || new Date().toISOString(),
        vehicles
      };
    });
  }

  getAdminMechanics() {
    const mechanics = this.data.users.filter((u) => u.role === 'MECHANIC');
    return mechanics.map((m) => {
      const assigned = this.data.bookings.filter((b) => b.mechanicId === m.id || b.assignedMechanicId === m.id);
      const completed = assigned.filter((b) => b.status === 'COMPLETED').length;
      const inProgress = assigned.filter((b) => b.status === 'REPAIRING' || b.status === 'ASSIGNED').length;
      const ratingInfo = this.getMechanicAverageRating(m.id);

      const completionRate = assigned.length > 0 ? Math.round((completed / assigned.length) * 100) : 100;
      const efficiencyScore = Math.min(99, Math.max(75, Math.round(completionRate * 0.5 + ratingInfo.averageRating * 10)));

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone || '',
        assignedJobs: assigned.length,
        completedJobs: completed,
        averageRepairTimeHours: 1.8,
        rating: ratingInfo.averageRating,
        efficiencyScore,
        status: inProgress >= 3 ? ('BUSY' as const) : ('AVAILABLE' as const),
        specialties: ['Engine Diagnostics', 'Brake Systems', 'EV Calibration', 'Hydraulic Steering']
      };
    });
  }

  toggleUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED'): UserRecord | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.status = status;
    user.updatedAt = new Date().toISOString();
    this.save();
    return user;
  }

  resetUserPassword(userId: string, newPasswordPlain: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    user.password = bcrypt.hashSync(newPasswordPlain, 10);
    user.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  updateServiceCenterStatus(
    centerId: string,
    updates: { workingStatus?: ServiceCenterWorkingStatus; isVerified?: boolean; name?: string; address?: string; phone?: string }
  ): ServiceCenterRecord | null {
    const center = (this.data.serviceCenters || []).find((c) => c.id === centerId);
    if (!center) return null;

    if (updates.workingStatus) center.workingStatus = updates.workingStatus;
    if (updates.isVerified !== undefined) center.isVerified = updates.isVerified;
    if (updates.name) center.name = updates.name;
    if (updates.address) center.address = updates.address;
    if (updates.phone) center.phoneNumber = updates.phone;

    center.updatedAt = new Date().toISOString();
    this.save();
    return center;
  }

  updateBookingServiceCenter(bookingId: string, serviceCenterId: string): BookingRecord | null {
    const booking = this.data.bookings.find((b) => b.id === bookingId);
    if (!booking) return null;
    booking.serviceCenterId = serviceCenterId;
    booking.updatedAt = new Date().toISOString();
    this.save();
    return booking;
  }

  cancelBookingByAdmin(bookingId: string, reason?: string): BookingRecord | null {
    const booking = this.data.bookings.find((b) => b.id === bookingId);
    if (!booking) return null;
    booking.status = 'CANCELLED';
    booking.updatedAt = new Date().toISOString();
    if (reason) {
      this.addRepairLog(bookingId, `Admin Cancelled: ${reason}`, 'SYSTEM');
    }
    this.save();
    return booking;
  }

  // ================= AI BUSINESS INSIGHTS GENERATION =================
  getAIBusinessInsights() {
    const totalBookings = this.data.bookings.length;
    const completedCount = this.data.bookings.filter((b) => b.status === 'COMPLETED').length;
    const brakeJobs = this.data.bookings.filter((b) => (b.serviceType || '').toLowerCase().includes('brake')).length;
    const evJobs = this.data.bookings.filter((b) => (b.serviceType || '').toLowerCase().includes('ev')).length;

    const insights = [
      {
        id: 'ai-ins-01',
        title: 'Brake Service Demand Surge',
        description: `Brake system service volume surged by 28% across North District hubs this month. Current shop stock of ceramic friction sets is decreasing.`,
        category: 'SERVICE_DEMAND' as const,
        impact: 'HIGH' as const,
        changePercentage: 28,
        recommendedAction: 'Automate restocking of Ceramic Pad Sets (BRK-CER-F1) for Central and West garages before peak weekend.',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
      },
      {
        id: 'ai-ins-02',
        title: 'Central Hub Efficiency Benchmark',
        description: `Central Auto Hub Delhi achieved a 99.2% on-time turnaround rate with a 4.95 star average customer satisfaction score.`,
        category: 'EFFICIENCY' as const,
        impact: 'POSITIVE' as const,
        changePercentage: 14,
        recommendedAction: 'Apply Central Hub multi-mechanic triage protocol to Southside Motors and Express Bay.',
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
      },
      {
        id: 'ai-ins-03',
        title: 'Weekend Booking Volume Acceleration',
        description: `Weekend service reservations increased by 34% compared to weekday averages. Bay utilization exceeds 92% on Saturdays.`,
        category: 'REVENUE' as const,
        impact: 'POSITIVE' as const,
        changePercentage: 34,
        recommendedAction: 'Open an additional express shift from 11:00 AM to 4:00 PM on Saturdays with 2 roaming master technicians.',
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
      },
      {
        id: 'ai-ins-04',
        title: 'EV Fleet Diagnostic Expansion',
        description: `Commercial EV diagnostic requests grew by 45% quarter-over-quarter as fleet clients transition delivery vans to electric.`,
        category: 'SERVICE_DEMAND' as const,
        impact: 'HIGH' as const,
        changePercentage: 45,
        recommendedAction: 'Equip West Coast Workshop with High-Voltage Pack Balancers and train two additional mechanics.',
        createdAt: new Date(Date.now() - 48 * 3600000).toISOString()
      },
      {
        id: 'ai-ins-05',
        title: 'Customer Retention & Loyalty Velocity',
        description: `Gold & Platinum membership tier customers generate 68% of recurring quarterly service revenue with 0% payment default rate.`,
        category: 'RETENTION' as const,
        impact: 'POSITIVE' as const,
        changePercentage: 18,
        recommendedAction: 'Launch proactive 30-day seasonal AC tuneup voucher promotion for Silver-tier accounts.',
        createdAt: new Date(Date.now() - 72 * 3600000).toISOString()
      }
    ];

    return insights;
  }

  // ================= ENTERPRISE ADMIN DASHBOARD PAYLOAD =================
  getEnterpriseAdminDashboardData() {
    const totalCustomers = this.data.users.filter((u) => u.role === 'CUSTOMER').length;
    const totalVehicles = this.data.vehicles.length;
    const serviceCenters = this.data.serviceCenters || this.getInitialServiceCenters();
    const activeCenters = serviceCenters.filter((c) => c.workingStatus !== 'CLOSED').length;
    const totalMechanics = this.data.users.filter((u) => u.role === 'MECHANIC').length;

    // Today's bookings
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todaysBookings = this.data.bookings.filter(
      (b) => (b.serviceDate && b.serviceDate.startsWith(todayStr)) || (b.createdAt && b.createdAt.startsWith(todayStr))
    ).length;

    const ongoingRepairs = this.data.bookings.filter((b) => b.status === 'REPAIRING' || b.status === 'ASSIGNED').length;
    const completedServices = this.data.bookings.filter((b) => b.status === 'COMPLETED').length;

    const totalInvoices = this.data.invoices || [];
    const monthlyRevenue = totalInvoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + (i.amount || (i.serviceCharges + i.partsCost + i.tax)), 0);

    const pendingPayments = totalInvoices
      .filter((i) => i.status === 'UNPAID')
      .reduce((sum, i) => sum + (i.amount || (i.serviceCharges + i.partsCost + i.tax)), 0);

    // Customer satisfaction rating
    const feedbacks = this.data.feedbacks || [];
    const avgRating = feedbacks.length > 0
      ? Number((feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(2))
      : 4.88;

    // Build 10 Enterprise KPI cards
    const kpis = [
      {
        id: 'kpi-customers',
        title: 'Total Customers',
        value: totalCustomers,
        prevValue: Math.max(1, totalCustomers - 1),
        growthPercentage: 12.5,
        trend: 'up' as const,
        targetTab: 'customers',
        iconName: 'Users',
        badge: '+12.5% MoM'
      },
      {
        id: 'kpi-vehicles',
        title: 'Registered Fleet Vehicles',
        value: totalVehicles,
        prevValue: Math.max(1, totalVehicles - 2),
        growthPercentage: 18.2,
        trend: 'up' as const,
        targetTab: 'vehicles',
        iconName: 'Car',
        badge: '+18.2% MoM'
      },
      {
        id: 'kpi-service-centers',
        title: 'Active Service Garages',
        value: activeCenters,
        prevValue: activeCenters,
        growthPercentage: 8.0,
        trend: 'up' as const,
        targetTab: 'service-centers',
        iconName: 'Building2',
        badge: '100% Operational'
      },
      {
        id: 'kpi-mechanics',
        title: 'Certified Bay Mechanics',
        value: totalMechanics,
        prevValue: totalMechanics,
        growthPercentage: 15.0,
        trend: 'up' as const,
        targetTab: 'mechanics',
        iconName: 'Wrench',
        badge: 'Full Staffing'
      },
      {
        id: 'kpi-today-bookings',
        title: "Today's Bay Bookings",
        value: Math.max(todaysBookings, 4),
        prevValue: 3,
        growthPercentage: 25.0,
        trend: 'up' as const,
        targetTab: 'all-bookings',
        iconName: 'Calendar',
        badge: 'Peak Demand'
      },
      {
        id: 'kpi-ongoing-repairs',
        title: 'Live Ongoing Repairs',
        value: ongoingRepairs,
        prevValue: 2,
        growthPercentage: 6.4,
        trend: 'up' as const,
        targetTab: 'all-bookings',
        iconName: 'Activity',
        badge: 'Live Bay'
      },
      {
        id: 'kpi-completed-services',
        title: 'Completed Services',
        value: completedServices,
        prevValue: Math.max(0, completedServices - 4),
        growthPercentage: 22.4,
        trend: 'up' as const,
        targetTab: 'all-bookings',
        iconName: 'CheckCircle2',
        badge: '98.5% On-Time'
      },
      {
        id: 'kpi-monthly-revenue',
        title: 'Monthly Revenue',
        value: `$${monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        prevValue: `$${(monthlyRevenue * 0.85).toFixed(2)}`,
        growthPercentage: 17.6,
        trend: 'up' as const,
        targetTab: 'invoices',
        iconName: 'DollarSign',
        badge: '+17.6% Target'
      },
      {
        id: 'kpi-pending-payments',
        title: 'Pending Collections',
        value: `$${pendingPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        prevValue: `$${(pendingPayments * 1.2).toFixed(2)}`,
        growthPercentage: -14.2,
        trend: 'down' as const,
        targetTab: 'invoices',
        iconName: 'Clock',
        badge: 'In Processing'
      },
      {
        id: 'kpi-csat',
        title: 'Customer CSAT Index',
        value: `${avgRating} / 5.0`,
        prevValue: '4.78',
        growthPercentage: 4.2,
        trend: 'up' as const,
        targetTab: 'analytics',
        iconName: 'Star',
        badge: 'Top Tier'
      }
    ];

    // Analytics: Monthly Revenue Data (Last 6 Months)
    const monthlyRevenueData = [
      { month: 'Mar', revenue: 14200, partsCost: 5200, laborCharges: 6100, profit: 2900, target: 12000 },
      { month: 'Apr', revenue: 16800, partsCost: 6100, laborCharges: 7200, profit: 3500, target: 14000 },
      { month: 'May', revenue: 19400, partsCost: 7300, laborCharges: 8100, profit: 4000, target: 16000 },
      { month: 'Jun', revenue: 23100, partsCost: 8800, laborCharges: 9800, profit: 4500, target: 19000 },
      { month: 'Jul', revenue: 26800, partsCost: 9900, laborCharges: 11400, profit: 5500, target: 22000 },
      { month: 'Aug', revenue: Math.max(monthlyRevenue, 31250), partsCost: 11200, laborCharges: 13800, profit: 6250, target: 25000 }
    ];

    // Service-wise Revenue Distribution
    const serviceRevenue = [
      { category: 'Periodic Maintenance', revenue: 12450, jobsCount: 56, color: '#f59e0b' },
      { category: 'Brake Overhauls', revenue: 8900, jobsCount: 38, color: '#ef4444' },
      { category: 'Engine Diagnostics', revenue: 6400, jobsCount: 29, color: '#3b82f6' },
      { category: 'EV Systems & Battery', revenue: 5800, jobsCount: 16, color: '#10b981' },
      { category: 'Transmission & Gearbox', revenue: 4200, jobsCount: 14, color: '#8b5cf6' },
      { category: 'Tyre & Alignment', revenue: 3100, jobsCount: 22, color: '#06b6d4' }
    ];

    // Payment Collection Trends
    const paymentTrends = [
      { method: 'UPI / QR Instant', amount: 18450, count: 64, percentage: 46, color: '#10b981' },
      { method: 'Credit & Debit Cards', amount: 12800, count: 35, percentage: 32, color: '#3b82f6' },
      { method: 'Corporate Net Banking', amount: 6200, count: 12, percentage: 15, color: '#8b5cf6' },
      { method: 'Cash on Delivery / POS', amount: 2800, count: 9, percentage: 7, color: '#f59e0b' }
    ];

    // Booking Volume Trends
    const bookingVolume = [
      { period: 'Mon', total: 18, completed: 15, inProgress: 2, cancelled: 1 },
      { period: 'Tue', total: 22, completed: 18, inProgress: 3, cancelled: 1 },
      { period: 'Wed', total: 26, completed: 21, inProgress: 4, cancelled: 1 },
      { period: 'Thu', total: 24, completed: 20, inProgress: 3, cancelled: 1 },
      { period: 'Fri', total: 31, completed: 25, inProgress: 5, cancelled: 1 },
      { period: 'Sat', total: 38, completed: 32, inProgress: 5, cancelled: 1 },
      { period: 'Sun', total: 19, completed: 16, inProgress: 2, cancelled: 1 }
    ];

    // Booking Status Distribution
    const bookingStatusDistribution = [
      { name: 'Pending Approval', value: this.data.bookings.filter((b) => b.status === 'PENDING').length || 2, color: '#f59e0b' },
      { name: 'Approved', value: this.data.bookings.filter((b) => b.status === 'APPROVED').length || 3, color: '#3b82f6' },
      { name: 'Assigned to Mechanic', value: this.data.bookings.filter((b) => b.status === 'ASSIGNED').length || 2, color: '#8b5cf6' },
      { name: 'Under Active Repair', value: this.data.bookings.filter((b) => b.status === 'REPAIRING').length || 3, color: '#06b6d4' },
      { name: 'Completed & Certified', value: this.data.bookings.filter((b) => b.status === 'COMPLETED').length || 8, color: '#10b981' },
      { name: 'Cancelled', value: this.data.bookings.filter((b) => b.status === 'CANCELLED').length || 1, color: '#ef4444' }
    ];

    // Enriched Service Centers with metrics
    const enrichedCenters = serviceCenters.map((c) => {
      const centerBookings = this.data.bookings.filter((b) => b.serviceCenterId === c.id);
      const completed = centerBookings.filter((b) => b.status === 'COMPLETED').length;
      const active = centerBookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length;
      return {
        id: c.id,
        name: c.name,
        city: c.city,
        address: c.address,
        rating: c.averageRating || 4.8,
        completedJobs: Math.max(c.totalServicesCompleted || 0, completed, 45),
        activeBookings: active,
        revenue: (c.totalRevenue || 12500) + completed * 180,
        responseTimeMin: c.averageResponseTime || 12,
        status: c.workingStatus || 'OPEN',
        isVerified: c.isVerified,
        verificationStatus: (c.isVerified ? 'VERIFIED' : 'PENDING') as 'VERIFIED' | 'PENDING' | 'REJECTED',
        mechanicsCount: c.availableMechanics || 4,
        satisfactionRate: 98.4,
        latitude: c.latitude,
        longitude: c.longitude
      };
    });

    const customers = this.getAdminCustomers();
    const mechanics = this.getAdminMechanics();
    const servicesInventory = this.getServicesInventory();
    const aiInsights = this.getAIBusinessInsights();

    const securitySummary = {
      totalLoginsToday: 142,
      failedLoginsToday: 2,
      adminActionsCount: (this.data.auditLogs || []).length,
      criticalSecurityEvents: 0,
      activeSessions: 18
    };

    return {
      kpis,
      analytics: {
        monthlyRevenue: monthlyRevenueData,
        serviceRevenue,
        paymentTrends,
        bookingVolume,
        bookingStatusDistribution,
        topServiceCenters: enrichedCenters,
        mechanicPerformance: mechanics,
        customerSatisfactionRating: avgRating
      },
      serviceCenters: enrichedCenters,
      customers,
      mechanics,
      servicesInventory,
      aiInsights,
      securitySummary
    };
  }

  // ================= ADMIN REPORT GENERATION =================
  getAdminReports(reportType: string = 'REVENUE', period: string = 'LAST_30_DAYS') {
    const now = new Date();
    const generatedAt = now.toISOString();

    const customers = this.getAdminCustomers();
    const mechanics = this.getAdminMechanics();
    const serviceCenters = this.data.serviceCenters || this.getInitialServiceCenters();
    const bookings = this.data.bookings || [];
    const invoices = this.data.invoices || [];

    let summary = {};
    let records: any[] = [];

    if (reportType === 'REVENUE') {
      const paidInvoices = invoices.filter((i) => i.status === 'PAID');
      const totalAmount = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
      summary = {
        totalRevenue: totalAmount,
        totalInvoices: paidInvoices.length,
        averageTicketSize: paidInvoices.length > 0 ? Math.round(totalAmount / paidInvoices.length) : 0,
        pendingCollection: invoices.filter((i) => i.status === 'UNPAID').reduce((sum, i) => sum + i.amount, 0)
      };
      records = paidInvoices.map((inv) => ({
        invoiceId: inv.id,
        bookingId: inv.bookingId,
        serviceCharges: inv.serviceCharges,
        partsCost: inv.partsCost,
        tax: inv.tax,
        totalAmount: inv.amount,
        status: inv.status,
        issuedAt: inv.issuedAt,
        paidAt: inv.paidAt
      }));
    } else if (reportType === 'CUSTOMERS') {
      summary = {
        totalRegistered: customers.length,
        activeAccounts: customers.filter((c) => c.status === 'ACTIVE').length,
        totalFleetVehicles: this.data.vehicles.length,
        topTierCustomers: customers.filter((c) => c.membershipTier === 'PLATINUM' || c.membershipTier === 'GOLD').length
      };
      records = customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        membershipTier: c.membershipTier,
        vehiclesCount: c.totalVehicles,
        bookingsCount: c.totalBookings,
        totalSpent: c.totalSpent,
        status: c.status
      }));
    } else if (reportType === 'MECHANICS') {
      summary = {
        totalMechanics: mechanics.length,
        availableMechanics: mechanics.filter((m) => m.status === 'AVAILABLE').length,
        averageRating: 4.88,
        totalJobsCompleted: mechanics.reduce((sum, m) => sum + m.completedJobs, 0)
      };
      records = mechanics.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        assignedJobs: m.assignedJobs,
        completedJobs: m.completedJobs,
        rating: m.rating,
        efficiencyScore: `${m.efficiencyScore}%`,
        status: m.status
      }));
    } else if (reportType === 'SERVICE_CENTERS') {
      summary = {
        totalCenters: serviceCenters.length,
        verifiedCenters: serviceCenters.filter((s) => s.isVerified).length,
        totalBays: serviceCenters.reduce((sum, s) => sum + (s.capacity || 4), 0)
      };
      records = serviceCenters.map((s) => ({
        id: s.id,
        name: s.name,
        city: s.city,
        address: s.address,
        rating: s.averageRating,
        servicesCompleted: s.totalServicesCompleted,
        workingStatus: s.workingStatus,
        isVerified: s.isVerified ? 'YES' : 'NO'
      }));
    } else {
      // BOOKING REPORT
      summary = {
        totalBookings: bookings.length,
        completed: bookings.filter((b) => b.status === 'COMPLETED').length,
        active: bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length,
        cancelled: bookings.filter((b) => b.status === 'CANCELLED').length
      };
      records = bookings.map((b) => ({
        bookingId: b.id,
        customerId: b.customerId,
        vehicleId: b.vehicleId,
        serviceType: b.serviceType,
        mechanicId: b.mechanicId || 'UNASSIGNED',
        serviceCenterId: b.serviceCenterId || 'PRIMARY_HUB',
        status: b.status,
        preferredDate: b.preferredDate,
        createdAt: b.createdAt
      }));
    }

    return {
      reportType,
      period,
      generatedAt,
      summary,
      recordCount: records.length,
      records
    };
  }

  // ================= AUTOMOTIVE WORKSHOP OPERATING SYSTEM (MECHANIC OS) =================

  // --- MECHANIC PROFILE & AVAILABILITY ---
  getMechanicProfile(mechanicId: string) {
    const user = this.getUserById(mechanicId);
    if (!user) return null;

    const mechanicBookings = this.getBookingsByMechanic(mechanicId);
    const completedBookings = mechanicBookings.filter((b) => b.status === 'COMPLETED');
    const activeBookings = mechanicBookings.filter((b) => b.status === 'REPAIRING' || b.status === 'INSPECTION' || b.status === 'QUALITY_CHECK');
    const pendingBookings = mechanicBookings.filter((b) => b.status === 'ASSIGNED' || b.status === 'APPROVED' || b.status === 'PENDING');

    const ratingInfo = this.getMechanicAverageRating(mechanicId);

    // Calculate average repair time from logs/bookings
    const logs = this.data.repairLogs.filter((rl) => rl.updatedBy === mechanicId && rl.hoursSpent);
    const totalHours = logs.reduce((sum, l) => sum + (l.hoursSpent || 0), 0);
    const avgHours = logs.length > 0 ? Number((totalHours / logs.length).toFixed(1)) : 1.8;

    // Assigned service center
    const center = user.assignedServiceCenterId
      ? this.getServiceCenterById(user.assignedServiceCenterId)
      : this.data.serviceCenters[0] || null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '+1 (555) 019-2834',
      role: user.role,
      availability: user.availability || 'AVAILABLE',
      assignedServiceCenterId: center?.id || null,
      serviceCenterName: center?.name || 'FleetOps Central Technical Hub',
      serviceCenterAddress: center?.address || '100 Automotive Blvd',
      serviceCenterCity: center?.city || 'San Francisco, CA',
      serviceCenterStatus: center?.workingStatus || 'OPEN',
      shiftName: user.shiftName || 'Morning Tech Bay Shift (08:00 - 17:00)',
      badgeNumber: user.badgeNumber || `TECH-${user.id.slice(-4).toUpperCase()}`,
      experienceYears: user.experienceYears || 6,
      specialties: user.specialties || ['Engine Diagnostics', 'Brake Systems', 'OBD-II Telemetry', 'EV Powertrain'],
      rating: ratingInfo.averageRating > 0 ? ratingInfo.averageRating : 4.9,
      totalRatingsCount: ratingInfo.count > 0 ? ratingInfo.count : completedBookings.length,
      efficiencyScore: completedBookings.length > 0 ? Math.min(98, Math.max(88, 92 + (completedBookings.length % 7))) : 94,
      completedJobsCount: completedBookings.length,
      activeJobsCount: activeBookings.length,
      pendingJobsCount: pendingBookings.length
    };
  }

  updateMechanicAvailability(mechanicId: string, availability: MechanicAvailabilityStatus) {
    const user = this.getUserById(mechanicId);
    if (!user) return null;
    return this.updateUser(mechanicId, { availability });
  }

  // --- OBD-II DIAGNOSTIC RECORDS ---
  getDiagnosticsByBooking(bookingId: string): OBDDiagnosticRecord[] {
    return (this.data.diagnostics || []).filter((d) => d.bookingId === bookingId);
  }

  addDiagnostic(data: Omit<OBDDiagnosticRecord, 'id' | 'createdAt' | 'status'> & { status?: 'ACTIVE' | 'RESOLVED' }): OBDDiagnosticRecord {
    if (!this.data.diagnostics) this.data.diagnostics = [];
    const newRecord: OBDDiagnosticRecord = {
      id: `dtc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      ...data
    };
    this.data.diagnostics.unshift(newRecord);
    this.save();
    return newRecord;
  }

  resolveDiagnostic(id: string): OBDDiagnosticRecord | null {
    if (!this.data.diagnostics) return null;
    const idx = this.data.diagnostics.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.diagnostics[idx].status = 'RESOLVED';
    this.data.diagnostics[idx].resolvedAt = new Date().toISOString();
    this.save();
    return this.data.diagnostics[idx];
  }

  deleteDiagnostic(id: string): boolean {
    if (!this.data.diagnostics) return false;
    const idx = this.data.diagnostics.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.data.diagnostics.splice(idx, 1);
    this.save();
    return true;
  }

  // --- VEHICLE INSPECTION REPORTS ---
  getInspectionByBooking(bookingId: string): RepairInspectionRecord | null {
    return (this.data.inspections || []).find((i) => i.bookingId === bookingId) || null;
  }

  saveInspection(report: Omit<RepairInspectionRecord, 'id' | 'createdAt'>): RepairInspectionRecord {
    if (!this.data.inspections) this.data.inspections = [];
    const existingIdx = this.data.inspections.findIndex((i) => i.bookingId === report.bookingId);
    
    const newRecord: RepairInspectionRecord = {
      id: existingIdx !== -1 ? this.data.inspections[existingIdx].id : `insp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...report
    };

    if (existingIdx !== -1) {
      this.data.inspections[existingIdx] = newRecord;
    } else {
      this.data.inspections.unshift(newRecord);
    }

    this.save();
    return newRecord;
  }

  // --- REPAIR WORKSPACE LOGS ---
  addWorkshopRepairLog(data: {
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
  }): RepairLogRecord {
    const hours = data.hoursSpent || 0;
    const rate = data.labourRate || 85;
    const labourCost = data.labourCost !== undefined ? data.labourCost : hours * rate;
    const partsCost = data.partsCost !== undefined ? data.partsCost : (data.partsReplaced || []).reduce((sum, p) => sum + (p.quantity * p.unitCost), 0);
    const totalCost = data.cost !== undefined ? data.cost : (labourCost + partsCost);

    const newLog: RepairLogRecord = {
      id: `rl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: data.bookingId,
      action: data.action || 'Repair Operation Logged',
      note: data.note,
      partsReplaced: data.partsReplaced || [],
      hoursSpent: hours,
      labourRate: rate,
      labourCost,
      partsCost,
      cost: totalCost,
      progressPercentage: data.progressPercentage !== undefined ? data.progressPercentage : undefined,
      updatedBy: data.updatedBy,
      createdAt: new Date().toISOString()
    };

    this.data.repairLogs.push(newLog);

    // If progressPercentage provided, update booking progress
    if (data.progressPercentage !== undefined) {
      const bIdx = this.data.bookings.findIndex((b) => b.id === data.bookingId);
      if (bIdx !== -1) {
        this.data.bookings[bIdx].progressPercentage = data.progressPercentage;
      }
    }

    this.save();
    return newLog;
  }

  // --- REPAIR IMAGES ---
  getRepairImagesByBooking(bookingId: string): RepairImageRecord[] {
    return (this.data.repairImages || []).filter((img) => img.bookingId === bookingId);
  }

  addRepairImage(data: Omit<RepairImageRecord, 'id' | 'createdAt'>): RepairImageRecord {
    if (!this.data.repairImages) this.data.repairImages = [];
    const newImage: RepairImageRecord = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...data
    };
    this.data.repairImages.unshift(newImage);
    this.save();
    return newImage;
  }

  deleteRepairImage(id: string): boolean {
    if (!this.data.repairImages) return false;
    const idx = this.data.repairImages.findIndex((img) => img.id === id);
    if (idx === -1) return false;
    this.data.repairImages.splice(idx, 1);
    this.save();
    return true;
  }

  toggleRepairImageCustomerApproval(id: string, isApproved: boolean): RepairImageRecord | null {
    if (!this.data.repairImages) return null;
    const idx = this.data.repairImages.findIndex((img) => img.id === id);
    if (idx === -1) return null;
    this.data.repairImages[idx].isApprovedForCustomer = isApproved;
    this.save();
    return this.data.repairImages[idx];
  }

  // --- SPARE PARTS CATALOG & REQUESTS ---
  getSparePartsCatalog(searchTerm?: string): ServiceInventoryRecord[] {
    const items = this.getServicesInventory();
    if (!searchTerm) return items;
    const q = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }

  getSparePartsRequestsByBooking(bookingId: string): SparePartsRequestRecord[] {
    return (this.data.sparePartsRequests || []).filter((req) => req.bookingId === bookingId);
  }

  getSparePartsRequestsByMechanic(mechanicId: string): SparePartsRequestRecord[] {
    return (this.data.sparePartsRequests || []).filter((req) => req.mechanicId === mechanicId);
  }

  createSparePartsRequest(data: Omit<SparePartsRequestRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: PartsRequestStatus }): SparePartsRequestRecord {
    if (!this.data.sparePartsRequests) this.data.sparePartsRequests = [];
    const now = new Date().toISOString();
    const newReq: SparePartsRequestRecord = {
      id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: data.status || 'PENDING',
      createdAt: now,
      updatedAt: now,
      ...data
    };
    this.data.sparePartsRequests.unshift(newReq);
    this.save();
    return newReq;
  }

  updateSparePartsRequestStatus(id: string, status: PartsRequestStatus): SparePartsRequestRecord | null {
    if (!this.data.sparePartsRequests) return null;
    const idx = this.data.sparePartsRequests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.sparePartsRequests[idx].status = status;
    this.data.sparePartsRequests[idx].updatedAt = new Date().toISOString();
    this.save();
    return this.data.sparePartsRequests[idx];
  }

  // --- WORKSHOP CHAT MESSAGES & APPROVALS ---
  getChatMessagesByBooking(bookingId: string): ChatMessageRecord[] {
    return this.getChatMessages(bookingId);
  }

  updateChatMessageApproval(messageId: string, approvalStatus: 'APPROVED' | 'REJECTED'): ChatMessageRecord | null {
    if (!this.data.chatMessages) return null;
    const idx = this.data.chatMessages.findIndex((m) => m.id === messageId);
    if (idx === -1) return null;
    this.data.chatMessages[idx].approvalStatus = approvalStatus;
    this.save();
    return this.data.chatMessages[idx];
  }

  // --- MECHANIC PERFORMANCE & KPI ANALYTICS ---
  getMechanicPerformanceMetrics(mechanicId: string) {
    const user = this.getUserById(mechanicId);
    const bookings = this.getBookingsByMechanic(mechanicId);
    const completed = bookings.filter((b) => b.status === 'COMPLETED');
    const active = bookings.filter((b) => b.status === 'REPAIRING' || b.status === 'INSPECTION' || b.status === 'QUALITY_CHECK');
    const pending = bookings.filter((b) => b.status === 'ASSIGNED' || b.status === 'APPROVED' || b.status === 'PENDING');

    const ratingInfo = this.getMechanicAverageRating(mechanicId);

    // Compute monthly completed breakdown for Recharts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const monthlyCompleted = months.slice(Math.max(0, currentMonthIdx - 5), currentMonthIdx + 1).map((m, idx) => {
      const baseCompleted = completed.length > 0 ? Math.max(1, Math.round(completed.length / (idx + 1))) : Math.floor(4 + idx * 2);
      return {
        month: m,
        completed: baseCompleted,
        target: Math.floor(baseCompleted * 1.25)
      };
    });

    // Repair time by service category
    const serviceTypeBreakdown = [
      { name: 'Periodic Maintenance', count: Math.max(1, Math.floor(completed.length * 0.4)), avgTimeHours: 1.2 },
      { name: 'Brake System Overhaul', count: Math.max(1, Math.floor(completed.length * 0.25)), avgTimeHours: 2.1 },
      { name: 'OBD-II Engine Diagnostics', count: Math.max(1, Math.floor(completed.length * 0.2)), avgTimeHours: 1.6 },
      { name: 'Electrical & Battery', count: Math.max(1, Math.floor(completed.length * 0.15)), avgTimeHours: 0.9 }
    ];

    // Ratings distribution
    const ratingDistribution = [
      { stars: 5, count: Math.max(4, Math.floor(completed.length * 0.8)) },
      { stars: 4, count: Math.max(1, Math.floor(completed.length * 0.15)) },
      { stars: 3, count: Math.floor(completed.length * 0.05) },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 }
    ];

    // Common diagnostic fault categories
    const commonFaults = [
      { category: 'Powertrain (P0xxx)', count: 14, color: '#f59e0b' },
      { category: 'Emissions (P04xx)', count: 9, color: '#ef4444' },
      { category: 'Brake ABS (C0xxx)', count: 6, color: '#3b82f6' },
      { category: 'Electrical (B0xxx)', count: 5, color: '#10b981' }
    ];

    return {
      totalCompletedRepairs: completed.length,
      activeJobsCount: active.length,
      pendingJobsCount: pending.length,
      avgRepairTimeHours: 1.8,
      customerRating: ratingInfo.averageRating > 0 ? ratingInfo.averageRating : 4.9,
      totalReviewsCount: ratingInfo.count > 0 ? ratingInfo.count : completed.length,
      efficiencyScore: 95,
      firstTimeFixRate: 98.2,
      monthlyCompleted,
      serviceTypeBreakdown,
      ratingDistribution,
      commonFaults
    };
  }
}

export const dbStore = new DatabaseStore();


