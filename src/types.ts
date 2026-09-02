export type Role = 'CUSTOMER' | 'ADMIN' | 'MECHANIC';

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'INSPECTION'
  | 'REPAIRING'
  | 'TESTING'
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

export interface VehicleServiceHistoryRecord {
  id: string;
  date: string;
  type: string;
  mileage: number;
  cost?: number;
  notes?: string;
  mechanicName?: string;
}

export interface Vehicle {
  id: string;
  vehicleId?: string;
  ownerId: string;
  registrationNumber: string;
  company?: string;
  brand: string;
  model: string;
  variant?: string;
  vehicleType: string;
  type?: string;
  category?: string;
  fuelType?: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'CNG' | 'LPG' | 'Hydrogen' | string;
  transmission?: 'Manual' | 'Automatic' | 'CVT' | 'Dual-Clutch' | 'Single-Speed' | string;
  manufacturingYear?: number;
  year: number;
  engineNumber?: string;
  chassisNumber?: string;
  color?: string;
  mileage?: number;
  batteryCapacity?: number; // kWh (for EV)
  range?: number; // km (for EV)
  vehicleImage?: string;
  serviceHistory?: VehicleServiceHistoryRecord[];
  healthScore?: number; // 0 - 100
  createdAt: string;
  updatedAt?: string;
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

export interface VehicleFleetStats {
  totalVehicles: number;
  totalEVs: number;
  totalHybrids: number;
  totalICE: number;
  averageHealthScore: number;
  byCategory: Record<string, number>;
  byFuelType: Record<string, number>;
  byBrand: Array<{ brand: string; count: number }>;
  healthScoreDistribution: {
    excellent: number; // 90-100
    good: number; // 75-89
    fair: number; // 50-74
    attention: number; // < 50
  };
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

export interface ServiceCenterAnalytics {
  center: ServiceCenter;
  summary: {
    totalServices: number;
    completedServices: number;
    activeBookings: number;
    totalRevenue: number;
    monthlyRevenue: number;
    averageRating: number;
    customerSatisfaction: number;
    avgResponseMinutes: number;
    mechanicUtilization: number;
  };
  monthlyServiceGrowth: Array<{ month: string; services: number; completed: number }>;
  revenueGrowth: Array<{ month: string; revenue: number; partsCost: number; profit: number }>;
  ratingTrend: Array<{ month: string; rating: number; reviewsCount: number }>;
  bookingStatusDistribution: Array<{ name: string; value: number; color: string }>;
}

export interface ServiceCenterRecommendation extends ServiceCenter {
  distanceKm: number;
  distanceText: string;
  recommendationScore: number;
  isBestChoice: boolean;
  recommendationReasons: string[];
  scoreBreakdown: {
    ratingScore: number;
    distanceScore: number;
    completedServicesScore: number;
    experienceScore: number;
    total: number;
  };
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

export interface MarketplaceListing {
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

export interface MarketplaceInquiry {
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

export interface AnalyticsSummary {
  totalUsers: number;
  totalMechanics: number;
  totalCustomers: number;
  totalAdmins: number;
  totalVehicles: number;
  totalBookings: number;
  pendingRequests: number;
  activeRepairs: number;
  completedServices: number;
  totalRevenue: number;
  pendingRevenue: number;
  mechanicWorkload: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    activeJobs: number;
    completedJobs: number;
    averageRating: number;
    reviewCount: number;
  }>;
}

// ================= CUSTOMER HEALTH & TELEMETRY TYPES =================
export interface VehicleHealthMetric {
  name: string;
  score: number; // 0-100
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  detail: string;
}

export interface VehicleHealth {
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  registrationNumber: string;
  vehicleType?: string;
  year?: number;
  currentMileage: number;
  overallHealthScore: number;
  metrics: {
    engineHealth: VehicleHealthMetric;
    brakeCondition: VehicleHealthMetric;
    oilLife: VehicleHealthMetric;
    batteryStatus: VehicleHealthMetric;
    tyrePressure: VehicleHealthMetric;
  };
  aiRecommendation: string;
  predictedService: string;
  predictedServiceDays: number;
  predictedServiceMileage: number;
  healthStatus: 'GOOD' | 'WARNING' | 'CRITICAL';
  lastUpdated: string;
}

export interface CustomerReminder {
  id: string;
  vehicleId: string;
  vehicleName: string;
  registrationNumber: string;
  title: string;
  description: string;
  type: 'OIL_CHANGE' | 'BRAKE_SERVICE' | 'INSURANCE_EXPIRY' | 'TIRE_ROTATION' | 'GENERAL_SERVICE';
  dueDate: string;
  dueMileage?: number;
  daysRemaining: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'DISMISSED';
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

export interface PaymentTransaction {
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

export interface CustomerRewards {
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tierColor: string;
  lifetimePoints: number;
  redeemedPoints: number;
  nextTierPointsRemaining: number;
  nextTierName: string;
  availableCoupons: Array<{
    code: string;
    title: string;
    discountAmount: number;
    pointsCost: number;
    minBillAmount: number;
    expiresAt: string;
  }>;
}

export interface CustomerDashboardData {
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    membershipTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    avatarUrl?: string;
  };
  stats: {
    totalVehicles: number;
    activeBookings: number;
    completedServices: number;
    totalSpending: number;
    pendingInvoicesAmount: number;
    rewardPoints: number;
  };
  vehicleHealthList: VehicleHealth[];
  activeBookings: Booking[];
  upcomingReminders: CustomerReminder[];
  recommendedGarages: ServiceCenterRecommendation[];
  rewards: CustomerRewards;
}

export interface CustomerPreference {
  userId: string;
  emailAlerts: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;
  marketingAlerts: boolean;
  preferredGarageId?: string;
}

// ================= ENTERPRISE ADMIN CONTROL CENTER TYPES =================
export interface AdminKPICard {
  id: string;
  title: string;
  value: string | number;
  prevValue?: string | number;
  growthPercentage: number;
  trend: 'up' | 'down' | 'neutral';
  targetTab: string;
  iconName: string;
  badge?: string;
}

export interface AdminMonthlyRevenue {
  month: string;
  revenue: number;
  partsCost: number;
  laborCharges: number;
  profit: number;
  target: number;
}

export interface ServiceCategoryRevenue {
  category: string;
  revenue: number;
  jobsCount: number;
  color: string;
}

export interface PaymentCollectionTrend {
  method: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface BookingVolumeTrend {
  period: string;
  total: number;
  completed: number;
  inProgress: number;
  cancelled: number;
}

export interface ServiceCenterPerformanceMetric {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  completedJobs: number;
  activeBookings: number;
  revenue: number;
  responseTimeMin: number;
  status: 'OPEN' | 'BUSY' | 'CLOSED';
  isVerified: boolean;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  mechanicsCount: number;
  satisfactionRate: number;
  latitude: number;
  longitude: number;
}

export interface AdminMechanicMetric {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedJobs: number;
  completedJobs: number;
  averageRepairTimeHours: number;
  rating: number;
  efficiencyScore: number;
  status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
  specialties: string[];
}

export interface ServiceInventoryItem {
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

export interface AIBusinessInsight {
  id: string;
  title: string;
  description: string;
  category: 'REVENUE' | 'SERVICE_DEMAND' | 'RETENTION' | 'EFFICIENCY' | 'INVENTORY';
  impact: 'HIGH' | 'MEDIUM' | 'POSITIVE' | 'WARNING';
  changePercentage?: number;
  recommendedAction: string;
  createdAt: string;
}

export interface SecurityAuditSummary {
  totalLoginsToday: number;
  failedLoginsToday: number;
  adminActionsCount: number;
  criticalSecurityEvents: number;
  activeSessions: number;
}

export interface AdminDashboardData {
  kpis: AdminKPICard[];
  analytics: {
    monthlyRevenue: AdminMonthlyRevenue[];
    serviceRevenue: ServiceCategoryRevenue[];
    paymentTrends: PaymentCollectionTrend[];
    bookingVolume: BookingVolumeTrend[];
    bookingStatusDistribution: Array<{ name: string; value: number; color: string }>;
    topServiceCenters: ServiceCenterPerformanceMetric[];
    mechanicPerformance: AdminMechanicMetric[];
    customerSatisfactionRating: number;
  };
  serviceCenters: ServiceCenterPerformanceMetric[];
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: 'ACTIVE' | 'SUSPENDED';
    membershipTier: string;
    totalVehicles: number;
    totalBookings: number;
    completedBookings: number;
    totalSpent: number;
    lastActive: string;
    vehicles: Vehicle[];
  }>;
  mechanics: AdminMechanicMetric[];
  servicesInventory: ServiceInventoryItem[];
  aiInsights: AIBusinessInsight[];
  securitySummary: SecurityAuditSummary;
  recentBookings?: any[];
}

export type ServiceInventoryRecord = ServiceInventoryItem;

export interface AdminReportResponse {
  reportType: string;
  period?: string;
  generatedAt: string;
  generatedBy?: string;
  dateRange?: { start: string; end: string };
  summary?: any;
  summaryMetrics?: {
    totalRevenue?: number;
    totalJobs?: number;
    completedJobs?: number;
    activeCustomers?: number;
    averageOrderValue?: number;
    laborCosts?: number;
    partsCost?: number;
    netMarginPercentage?: number;
    totalCenters?: number;
    verifiedCenters?: number;
    totalBays?: number;
  };
  executiveSummary?: string;
  keyInsights?: string[];
  recommendations?: string[];
  breakdown?: any[];
  records?: any[];
  data?: any[];
  recordCount?: number;
}

// ================= AUTOMOTIVE WORKSHOP OPERATING SYSTEM (MECHANIC OS) =================

export type MechanicAvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface MechanicProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  availability: MechanicAvailabilityStatus;
  assignedServiceCenterId?: string | null;
  serviceCenterName?: string;
  serviceCenterAddress?: string;
  serviceCenterCity?: string;
  serviceCenterStatus?: string;
  shiftName?: string;
  badgeNumber?: string;
  experienceYears?: number;
  specialties?: string[];
  rating: number;
  totalRatingsCount: number;
  efficiencyScore: number;
  completedJobsCount: number;
  activeJobsCount: number;
  pendingJobsCount?: number;
}

export type OBDDiagnosticSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type OBDSystemCategory = 'POWERTRAIN' | 'EMISSIONS' | 'BRAKES' | 'ELECTRICAL' | 'TRANSMISSION' | 'SUSPENSION' | 'HVAC';

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
  items: InspectionChecklistItem[];
  summaryNotes: string;
  createdAt: string;
  overallGrade?: string;
  technicianNotes?: string;
}

export type RepairImageCategory = 'BEFORE' | 'AFTER' | 'DIAGNOSTIC';

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

export interface SparePartInventoryItem {
  id: string;
  name: string;
  code: string;
  partNumber?: string;
  category: string;
  price: number;
  unitPrice?: number;
  costPrice: number;
  stockQuantity: number;
  inStock?: number;
  reorderLevel: number;
  unit: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export type SparePartCatalogItem = SparePartInventoryItem;

export type PartsRequestStatus = 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'INSTALLED' | 'REJECTED';
export type SparePartsUrgency = 'NORMAL' | 'HIGH' | 'URGENT';

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
  urgency: SparePartsUrgency;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SparePartsRequest = SparePartsRequestRecord;

export interface MechanicPerformanceData {
  totalCompletedRepairs: number;
  activeJobsCount: number;
  pendingJobsCount: number;
  avgRepairTimeHours: number;
  customerRating: number;
  totalReviewsCount: number;
  efficiencyScore: number;
  firstTimeFixRate: number;
  monthlyCompleted: Array<{ month: string; completed: number; target: number }>;
  serviceTypeBreakdown: Array<{ name: string; count: number; avgTimeHours: number }>;
  ratingDistribution: Array<{ stars: number; count: number }>;
  commonFaults: Array<{ category: string; count: number; color: string }>;
  activeJobs?: number;
  averageRepairTimeHours?: number;
}

export type MechanicPerformanceMetrics = MechanicPerformanceData;





