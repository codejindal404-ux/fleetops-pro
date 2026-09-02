import { User, Vehicle, Booking, Invoice, Role, AuditLog, MarketplaceListing, MarketplaceInquiry, AnalyticsSummary, ServiceCenter, ServiceCenterRecommendation, ServiceCenterWorkingStatus } from '../types.ts';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const getHeaders = () => {
  const token = localStorage.getItem('fleetops_token') || localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function requestJson(url: string, options: RequestInit = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const res = await fetch(fullUrl, options);
  const data = await res.json().catch(() => ({}));
  
  if (res.status === 401) {
    localStorage.removeItem('fleetops_token');
    localStorage.removeItem('token');
  }
  
  if (!res.ok) {
    throw new Error(data.message || (data.errors && data.errors[0]?.msg) || 'API request failed');
  }
  
  return data;
}

export const apiClient = {
  // Auth
  async login(email: string, password: string) {
    const data = await requestJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (data.token) localStorage.setItem('fleetops_token', data.token);
    return data;
  },

  async verifyOtp(pendingToken: string, code: string) {
    const data = await requestJson('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pendingToken, code })
    });
    if (data.token) localStorage.setItem('fleetops_token', data.token);
    return data;
  },

  async resendOtp(pendingToken: string) {
    return requestJson('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pendingToken })
    });
  },

  async forgotPassword(email: string) {
    return requestJson('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(resetToken: string, code: string, newPassword: string) {
    return requestJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, code, newPassword })
    });
  },

  async resendResetOtp(resetToken: string) {
    return requestJson('/api/auth/resend-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken })
    });
  },

  async register(name: string, email: string, password: string, phone?: string) {
    const data = await requestJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone })
    });
    if (data.token) localStorage.setItem('fleetops_token', data.token);
    return data;
  },

  logout() {
    localStorage.removeItem('fleetops_token');
  },

  async getMe(): Promise<{ user: User }> {
    return requestJson('/api/auth/me', { headers: getHeaders() });
  },

  async updateProfile(profileData: { name?: string; email?: string; phone?: string; newPassword?: string }): Promise<{ message: string; user: User }> {
    return requestJson('/api/auth/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
  },

  async getUsers(): Promise<User[]> {
    const data = await requestJson('/api/auth/users', { headers: getHeaders() });
    return data.users || [];
  },

  async createStaff(name: string, email: string, password: string, role: Role, phone?: string) {
    return requestJson('/api/auth/create-staff', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password, role, phone })
    });
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return requestJson(`/api/auth/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  // ================= ADMIN RBAC ENDPOINTS =================
  async getAdminUsers(): Promise<{ users: User[]; count: number }> {
    return requestJson('/api/admin/users', { headers: getHeaders() });
  },

  async updateAdminUser(id: string, data: Partial<{ name: string; email: string; phone: string; role: Role; password?: string }>): Promise<{ message: string; user: User }> {
    return requestJson(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async createMechanicAccount(data: { name: string; email: string; password: string; phone?: string }): Promise<{ message: string; user: User }> {
    return requestJson('/api/admin/create-mechanic', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async createUserAccount(data: { name: string; email: string; password: string; role: Role; phone?: string }): Promise<{ message: string; user: User }> {
    return requestJson('/api/admin/create-user', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async getAdminAuditLogs(): Promise<{ auditLogs: AuditLog[]; count: number }> {
    return requestJson('/api/admin/audit-logs', { headers: getHeaders() });
  },

  async getAdminAnalytics(): Promise<{ analytics: AnalyticsSummary }> {
    return requestJson('/api/admin/analytics', { headers: getHeaders() });
  },

  async approveBooking(id: string): Promise<{ message: string; booking: Booking }> {
    return requestJson(`/api/admin/bookings/${id}/approve`, {
      method: 'PATCH',
      headers: getHeaders()
    });
  },

  async assignMechanic(id: string, mechanicId: string): Promise<{ message: string; booking: Booking }> {
    return requestJson(`/api/admin/bookings/${id}/assign`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ mechanicId, assignedMechanicId: mechanicId })
    });
  },

  // ================= MECHANIC RBAC ENDPOINTS =================
  async getMechanicJobs(): Promise<{ jobs: Booking[]; tasks: Booking[]; count: number }> {
    return requestJson('/api/mechanic/jobs', { headers: getHeaders() });
  },

  async getMechanicTasks(): Promise<{ tasks: Booking[]; jobs: Booking[]; count: number }> {
    return requestJson('/api/mechanic/tasks', { headers: getHeaders() });
  },

  async getMechanicTaskById(id: string): Promise<{ task: Booking; job: Booking; booking: Booking }> {
    return requestJson(`/api/mechanic/tasks/${id}`, { headers: getHeaders() });
  },

  async getMechanicProfile(): Promise<{ profile: any }> {
    return requestJson('/api/mechanic/profile', { headers: getHeaders() });
  },

  async updateMechanicAvailability(availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE'): Promise<{ message: string; availability: string; user: any }> {
    return requestJson('/api/mechanic/availability', {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ availability })
    });
  },

  async getMechanicPerformance(): Promise<{ metrics: any }> {
    return requestJson('/api/mechanic/performance', { headers: getHeaders() });
  },

  async acceptMechanicJob(id: string): Promise<{ message: string; job: Booking }> {
    return requestJson(`/api/mechanic/jobs/${id}/accept`, {
      method: 'POST',
      headers: getHeaders()
    });
  },

  async updateMechanicTaskStatus(
    id: string,
    status: string,
    extra?: { mileage?: number; notes?: string; progressPercentage?: number }
  ): Promise<{ message: string; booking: Booking; job: Booking }> {
    return requestJson(`/api/mechanic/jobs/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, ...extra })
    });
  },

  async addMechanicRepairLog(
    id: string,
    logData: string | {
      action?: string;
      note: string;
      partsReplaced?: any[];
      hoursSpent?: number;
      labourRate?: number;
      labourCost?: number;
      partsCost?: number;
      cost?: number;
      progressPercentage?: number;
    }
  ): Promise<{ message: string; repairLog: any }> {
    const payload = typeof logData === 'string' ? { note: logData } : logData;
    return requestJson(`/api/mechanic/jobs/${id}/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
  },

  // OBD-II Diagnostics
  async getDiagnostics(bookingId: string): Promise<{ diagnostics: any[] }> {
    return requestJson(`/api/mechanic/diagnostics/${bookingId}`, { headers: getHeaders() });
  },

  async addDiagnostic(data: {
    bookingId: string;
    vehicleId: string;
    faultCode: string;
    systemCategory?: string;
    problemDescription: string;
    severity?: string;
    recommendedSolution: string;
  }): Promise<{ message: string; diagnostic: any }> {
    return requestJson('/api/mechanic/diagnostics', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async resolveDiagnostic(id: string): Promise<{ message: string; diagnostic: any }> {
    return requestJson(`/api/mechanic/diagnostics/${id}/resolve`, {
      method: 'PATCH',
      headers: getHeaders()
    });
  },

  async deleteDiagnostic(id: string): Promise<{ message: string }> {
    return requestJson(`/api/mechanic/diagnostics/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  // Vehicle Inspection
  async getInspection(bookingId: string): Promise<{ inspection: any }> {
    return requestJson(`/api/mechanic/inspections/${bookingId}`, { headers: getHeaders() });
  },

  async saveInspection(data: any): Promise<{ message: string; inspection: any }> {
    return requestJson('/api/mechanic/inspections', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  // Repair Images
  async getRepairImages(bookingId: string): Promise<{ images: any[] }> {
    return requestJson(`/api/mechanic/images/${bookingId}`, { headers: getHeaders() });
  },

  async uploadRepairImage(data: {
    bookingId: string;
    vehicleId?: string;
    category?: string;
    imageUrl: string;
    caption: string;
    isApprovedForCustomer?: boolean;
  }): Promise<{ message: string; image: any }> {
    return requestJson('/api/mechanic/images', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async deleteRepairImage(id: string): Promise<{ message: string }> {
    return requestJson(`/api/mechanic/images/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  async toggleImageApproval(id: string, isApproved: boolean): Promise<{ message: string; image: any }> {
    return requestJson(`/api/mechanic/images/${id}/approve`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isApproved })
    });
  },

  // Spare Parts
  async getSparePartsCatalog(search?: string): Promise<{ parts: any[] }> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return requestJson(`/api/mechanic/parts${q}`, { headers: getHeaders() });
  },

  async getSparePartsRequests(bookingId?: string): Promise<{ requests: any[] }> {
    const q = bookingId ? `?bookingId=${encodeURIComponent(bookingId)}` : '';
    return requestJson(`/api/mechanic/parts-requests${q}`, { headers: getHeaders() });
  },

  async createSparePartsRequest(data: any): Promise<{ message: string; request: any }> {
    return requestJson('/api/mechanic/parts-request', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  // Workshop Chat
  async getWorkshopChatMessages(bookingId: string): Promise<{ messages: any[] }> {
    return requestJson(`/api/mechanic/chat/${bookingId}`, { headers: getHeaders() });
  },

  async sendWorkshopChatMessage(bookingId: string, data: {
    message: string;
    imageUrl?: string;
    type?: string;
    actionPayload?: any;
  }): Promise<{ message: string; chatMessage: any }> {
    return requestJson(`/api/mechanic/chat/${bookingId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async updateWorkshopChatApproval(messageId: string, approvalStatus: 'APPROVED' | 'REJECTED'): Promise<{ message: string; chatMessage: any }> {
    return requestJson(`/api/mechanic/chat/approval/${messageId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ approvalStatus })
    });
  },

  // ================= CUSTOMER RBAC ENDPOINTS =================
  async getCustomerDashboard(): Promise<any> {
    return requestJson('/api/customer/dashboard', { headers: getHeaders() });
  },

  async getCustomerVehicleHealth(): Promise<{ health: any[]; count: number }> {
    return requestJson('/api/customer/vehicle-health', { headers: getHeaders() });
  },

  async getCustomerReminders(): Promise<{ reminders: any[]; count: number }> {
    return requestJson('/api/customer/reminders', { headers: getHeaders() });
  },

  async getCustomerRewards(): Promise<any> {
    return requestJson('/api/customer/rewards', { headers: getHeaders() });
  },

  async redeemCustomerCoupon(code: string): Promise<{ success: boolean; discountAmount: number; message: string }> {
    return requestJson('/api/customer/rewards/redeem', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code })
    });
  },

  async getCustomerChat(bookingId: string): Promise<{ messages: any[]; count: number; mechanic: any }> {
    return requestJson(`/api/customer/chat/${bookingId}`, { headers: getHeaders() });
  },

  async sendCustomerChatMessage(data: { bookingId: string; message: string; imageUrl?: string }): Promise<{ message: string; chatMessage: any }> {
    return requestJson('/api/customer/chat/message', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async processCustomerPayment(data: { invoiceId: string; amount: number; paymentMethod: 'UPI' | 'CARD' | 'RAZORPAY' | 'NET_BANKING' }): Promise<{ message: string; transaction: any; invoice: any }> {
    return requestJson('/api/customer/payment/create', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async cancelCustomerBooking(bookingId: string): Promise<{ message: string; booking: any }> {
    return requestJson(`/api/customer/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: getHeaders()
    });
  },

  async getCustomerPreferences(): Promise<{ preferences: any }> {
    return requestJson('/api/customer/preferences', { headers: getHeaders() });
  },

  async updateCustomerPreferences(preferences: any): Promise<{ message: string; preferences: any }> {
    return requestJson('/api/customer/preferences', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(preferences)
    });
  },

  async getCustomerVehicles(): Promise<{ vehicles: Vehicle[]; count: number }> {
    return requestJson('/api/customer/vehicles', { headers: getHeaders() });
  },

  async addCustomerVehicle(data: { registrationNumber: string; brand: string; model: string; year: number; vehicleType?: string; mileage?: number }): Promise<{ message: string; vehicle: Vehicle }> {
    return requestJson('/api/customer/vehicles', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async getCustomerBookings(): Promise<{ bookings: Booking[]; count: number }> {
    return requestJson('/api/customer/bookings', { headers: getHeaders() });
  },

  async createCustomerBooking(data: { vehicleId: string; serviceType: string; preferredDate: string; serviceCenterId?: string; issueDescription?: string }): Promise<{ message: string; booking: Booking }> {
    return requestJson('/api/customer/bookings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async submitCustomerReview(data: { bookingId: string; rating: number; comment?: string }): Promise<{ message: string; feedback: any }> {
    return requestJson('/api/customer/reviews', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async payCustomerInvoice(invoiceId: string): Promise<{ message: string; invoice: Invoice }> {
    return requestJson(`/api/customer/invoices/${invoiceId}/pay`, {
      method: 'PATCH',
      headers: getHeaders()
    });
  },

  // ================= MARKETPLACE ENDPOINTS =================
  async getMarketplaceListings(): Promise<{ listings: MarketplaceListing[]; count: number }> {
    return requestJson('/api/marketplace', { headers: getHeaders() });
  },

  async createMarketplaceListing(data: {
    title: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    condition: string;
    vehicleType?: string;
    description: string;
  }): Promise<{ message: string; listing: MarketplaceListing }> {
    return requestJson('/api/marketplace', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async submitMarketplaceInquiry(listingId: string, data: { message: string; phone?: string; offerPrice?: number }): Promise<{ message: string; inquiry: MarketplaceInquiry }> {
    return requestJson(`/api/marketplace/${listingId}/inquire`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  // General Vehicles & Global Database Catalog
  async getVehicles(): Promise<Vehicle[]> {
    const data = await requestJson('/api/vehicles', { headers: getHeaders() });
    return data.vehicles || [];
  },

  async getVehicleCatalog(): Promise<{ catalog: any[] }> {
    return requestJson('/api/vehicles/catalog', { headers: getHeaders() });
  },

  async getVehicleCategories(): Promise<{ categories: string[] }> {
    return requestJson('/api/vehicles/catalog/categories', { headers: getHeaders() });
  },

  async addCatalogCompany(data: { company: string; country?: string; category?: string; vehicles?: any[] }): Promise<{ message: string; company: any }> {
    return requestJson('/api/vehicles/catalog/company', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async addCatalogModel(data: { company: string; model: string; type?: string; fuel?: string[]; transmissions?: string[]; defaultBatteryCapacity?: number; defaultRange?: number }): Promise<{ message: string }> {
    return requestJson('/api/vehicles/catalog/model', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async getVehicleStats(): Promise<{ stats: any }> {
    return requestJson('/api/vehicles/stats', { headers: getHeaders() });
  },

  async addVehicle(vehicleData: Partial<Vehicle>) {
    const data = await requestJson('/api/vehicles', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(vehicleData)
    });
    return data.vehicle;
  },

  async deleteVehicle(id: string) {
    return requestJson(`/api/vehicles/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  async updateVehicle(id: string, updates: Partial<Vehicle>) {
    const data = await requestJson(`/api/vehicles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return data.vehicle;
  },

  async getVehicleDetails(id: string) {
    return requestJson(`/api/vehicles/${id}`, {
      headers: getHeaders()
    });
  },

  // ================= RECURRING SERVICE REMINDERS =================
  async getVehicleReminders(id: string) {
    return requestJson(`/api/vehicles/${id}/reminders`, {
      headers: getHeaders()
    });
  },

  async evaluateVehicleReminder(id: string, force = true) {
    return requestJson(`/api/vehicles/${id}/reminders/evaluate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ force })
    });
  },

  async updateVehicleMileage(id: string, mileage: number) {
    return requestJson(`/api/vehicles/${id}/mileage`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ mileage })
    });
  },

  async updateVehicleReminderConfig(id: string, config: {
    serviceIntervalMonths?: number;
    serviceIntervalMileage?: number;
    avgMonthlyMileage?: number;
    recurringReminderEnabled?: boolean;
    lastServiceDate?: string;
    lastServiceMileage?: number;
    serviceReminderNotes?: string;
  }) {
    return requestJson(`/api/vehicles/${id}/reminders/config`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(config)
    });
  },

  async checkAllFleetReminders(force = false) {
    return requestJson('/api/vehicles/reminders/check-all', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ force })
    });
  },

  // Bookings
  async getBookings(status?: string): Promise<Booking[]> {
    const url = status ? `/api/bookings?status=${status}` : '/api/bookings';
    const data = await requestJson(url, { headers: getHeaders() });
    return data.bookings || [];
  },

  async getBookingById(id: string): Promise<Booking> {
    const data = await requestJson(`/api/bookings/${id}`, { headers: getHeaders() });
    return data.booking;
  },

  async createBooking(bookingData: { vehicleId: string; serviceType: string; preferredDate: string; serviceCenterId?: string }) {
    const data = await requestJson('/api/bookings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookingData)
    });
    return data.booking;
  },

  async deleteBooking(id: string): Promise<{ message: string }> {
    return requestJson(`/api/bookings/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  async deleteAllBookings(): Promise<{ message: string }> {
    return requestJson('/api/bookings/all', {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  async updateBookingStatus(id: string, status: string) {
    const data = await requestJson(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return data.booking;
  },

  async addRepairLog(bookingId: string, note: string) {
    const data = await requestJson(`/api/bookings/${bookingId}/repair-logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ note })
    });
    return data.repairLog;
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const data = await requestJson('/api/invoices', { headers: getHeaders() });
    return data.invoices || [];
  },

  async createInvoice(bookingId: string, serviceCharges: number, partsCost: number, tax: number) {
    const data = await requestJson(`/api/bookings/${bookingId}/invoice`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ serviceCharges, partsCost, tax })
    });
    return data.invoice;
  },

  async payInvoice(id: string) {
    const data = await requestJson(`/api/invoices/${id}/pay`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return data.invoice;
  },

  // Feedback
  async getFeedback() {
    return requestJson('/api/feedback', { headers: getHeaders() });
  },

  async submitFeedback(bookingId: string, rating: number, comment: string) {
    const data = await requestJson(`/api/bookings/${bookingId}/feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rating, comment })
    });
    return data.feedback;
  },

  async getMechanicRating(mechanicId: string) {
    return requestJson(`/api/mechanics/${mechanicId}/rating`, { headers: getHeaders() });
  },

  // --- SERVICE CENTER & MAP RECOMMENDATIONS API ---
  async getServiceCenters(params?: {
    city?: string;
    search?: string;
    verifiedOnly?: boolean;
    minRating?: number;
  }): Promise<ServiceCenter[]> {
    const query = new URLSearchParams();
    if (params?.city) query.append('city', params.city);
    if (params?.search) query.append('search', params.search);
    if (params?.verifiedOnly) query.append('verifiedOnly', 'true');
    if (params?.minRating) query.append('minRating', params.minRating.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    const data = await requestJson(`/api/service-centers${qs}`);
    return data.serviceCenters || [];
  },

  async getNearbyServiceCenters(lat: number, lng: number, radiusKm?: number): Promise<ServiceCenter[]> {
    const query = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString()
    });
    if (radiusKm !== undefined) {
      query.append('radius', radiusKm.toString());
    }
    const data = await requestJson(`/api/service-centers/nearby?${query.toString()}`);
    return data.serviceCenters || [];
  },

  async getRecommendedServiceCenters(lat: number, lng: number, radiusKm?: number): Promise<{
    recommendations: ServiceCenterRecommendation[];
    algorithm: { formula: string; weights: Record<string, string> };
    radiusKm: number;
    userLocation: { latitude: number; longitude: number };
  }> {
    const query = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString()
    });
    if (radiusKm !== undefined) {
      query.append('radius', radiusKm.toString());
    }
    return requestJson(`/api/service-centers/recommendations?${query.toString()}`);
  },

  async getServiceCenterById(id: string): Promise<{
    serviceCenter: ServiceCenter & { activeBookingsCount?: number; recentBookings?: Booking[] };
  }> {
    return requestJson(`/api/service-centers/${id}`);
  },

  async createServiceCenter(centerData: Partial<ServiceCenter>): Promise<{
    message: string;
    serviceCenter: ServiceCenter;
  }> {
    return requestJson('/api/service-centers', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(centerData)
    });
  },

  async updateServiceCenter(id: string, updates: Partial<ServiceCenter>): Promise<{
    message: string;
    serviceCenter: ServiceCenter;
  }> {
    return requestJson(`/api/service-centers/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
  },

  async verifyServiceCenter(id: string, isVerified: boolean = true): Promise<{
    message: string;
    serviceCenter: ServiceCenter;
  }> {
    return requestJson(`/api/service-centers/${id}/verify`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isVerified })
    });
  },

  async updateServiceCenterWorkingStatus(
    id: string,
    workingStatus: ServiceCenterWorkingStatus,
    availableMechanics?: number
  ): Promise<{
    message: string;
    serviceCenter: ServiceCenter;
  }> {
    return requestJson(`/api/service-centers/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ workingStatus, availableMechanics })
    });
  },

  async deleteServiceCenter(id: string): Promise<{ message: string }> {
    return requestJson(`/api/service-centers/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  // ================= ENTERPRISE ADMIN API METHODS =================
  async getEnterpriseAdminDashboard(): Promise<{ success: boolean; data: any }> {
    return requestJson('/api/admin/dashboard', { headers: getHeaders() });
  },

  async getAdminCustomers(): Promise<{ success: boolean; count: number; customers: any[] }> {
    return requestJson('/api/admin/customers', { headers: getHeaders() });
  },

  async getAdminMechanics(): Promise<{ success: boolean; count: number; mechanics: any[] }> {
    return requestJson('/api/admin/mechanics', { headers: getHeaders() });
  },

  async getAdminReports(type: string = 'REVENUE', period: string = 'LAST_30_DAYS'): Promise<{ success: boolean; report: any }> {
    return requestJson(`/api/admin/reports?type=${type}&period=${period}`, { headers: getHeaders() });
  },

  async updateUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<{ success: boolean; message: string; user: any }> {
    return requestJson(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
  },

  async adminResetPassword(id: string, newPassword?: string): Promise<{ success: boolean; message: string }> {
    return requestJson(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword })
    });
  },

  async updateAdminServiceCenterStatus(id: string, data: any): Promise<{ success: boolean; message: string; serviceCenter: any }> {
    return requestJson(`/api/admin/service-centers/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async transferBookingCenter(bookingId: string, serviceCenterId: string): Promise<{ success: boolean; message: string; booking: any }> {
    return requestJson(`/api/admin/bookings/${bookingId}/change-center`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ serviceCenterId })
    });
  },

  async cancelBookingByAdmin(bookingId: string, reason?: string): Promise<{ success: boolean; message: string; booking: any }> {
    return requestJson(`/api/admin/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
  },

  async getServicesInventory(): Promise<{ success: boolean; count: number; items: any[] }> {
    return requestJson('/api/admin/services-inventory', { headers: getHeaders() });
  },

  async createInventoryItem(data: any): Promise<{ success: boolean; message: string; item: any }> {
    return requestJson('/api/admin/services-inventory', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async updateInventoryItem(id: string, data: any): Promise<{ success: boolean; message: string; item: any }> {
    return requestJson(`/api/admin/services-inventory/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
  },

  async deleteInventoryItem(id: string): Promise<{ success: boolean; message: string }> {
    return requestJson(`/api/admin/services-inventory/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  async getAIBusinessInsights(): Promise<{ success: boolean; count: number; insights: any[] }> {
    return requestJson('/api/admin/ai-insights', { headers: getHeaders() });
  }
};

