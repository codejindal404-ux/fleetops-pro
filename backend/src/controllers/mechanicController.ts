import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { dbStore, BookingStatus, MechanicAvailabilityStatus } from '../services/dbStore.ts';
import { validateBookingStatusTransition } from '../utils/statusTransitions.ts';
import { canMechanicUpdateStatus, canMechanicTransition } from '../utils/permissions.ts';
import { notificationService } from '../services/notificationService.ts';
import { sendToUser, broadcastEvent, sendToRole } from '../services/socketService.ts';
import { firebaseService } from '../services/firebaseService.ts';

// Helper to enrich a booking with full relational details
export function enrichJobWithDetails(b: any) {
  const vehicle = b.vehicle || dbStore.getVehicleById(b.vehicleId);
  const customer = b.customer || dbStore.getUserById(b.customerId);
  const mechanic = b.mechanic || (b.mechanicId
    ? dbStore.getUserById(b.mechanicId)
    : b.assignedMechanicId
    ? dbStore.getUserById(b.assignedMechanicId)
    : null);

  const repairLogs = (b.repairLogs || dbStore.getRepairLogsByBooking(b.id) || []).map((rl: any) => {
    const user = rl.updatedByUser || dbStore.getUserById(rl.updatedBy);
    return {
      ...rl,
      updatedByUser: user ? { id: user.id, name: user.name, role: user.role } : null
    };
  });

  const diagnostics = b.diagnostics || dbStore.getDiagnosticsByBooking(b.id) || [];
  const inspection = b.inspection || dbStore.getInspectionByBooking(b.id) || null;
  const images = b.images || dbStore.getRepairImagesByBooking(b.id) || [];
  const partsRequests = b.partsRequests || dbStore.getSparePartsRequestsByBooking(b.id) || [];
  const chatMessages = b.chatMessages || dbStore.getChatMessagesByBooking(b.id) || [];
  const invoice = b.invoice || dbStore.getInvoiceByBookingId(b.id) || null;
  const feedback = b.feedback || dbStore.getFeedbackByBooking(b.id) || null;
  const serviceCenter = b.serviceCenter || (b.serviceCenterId ? dbStore.getServiceCenterById(b.serviceCenterId) : null);

  return {
    ...b,
    customerId: b.customerId,
    customerName: customer ? customer.name : (b.customerName || 'Customer'),
    vehicleId: b.vehicleId,
    vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : (b.vehicleName || 'Vehicle'),
    serviceDate: b.serviceDate || b.preferredDate,
    issueDescription: b.issueDescription || b.serviceType,
    assignedMechanicId: b.assignedMechanicId || b.mechanicId || null,
    assignedMechanicName: b.assignedMechanicName || (mechanic ? mechanic.name : null),
    priority: b.priority || 'NORMAL',
    estimatedCost: b.estimatedCost || (invoice ? invoice.amount : 250),
    progressPercentage: b.progressPercentage || (b.status === 'COMPLETED' ? 100 : b.status === 'QUALITY_CHECK' ? 90 : b.status === 'REPAIRING' ? 60 : b.status === 'INSPECTION' ? 30 : 0),
    vehicle: vehicle || b.vehicle || null,
    customer: customer ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } : (b.customer || null),
    mechanic: mechanic ? { id: mechanic.id, name: mechanic.name, email: mechanic.email, phone: mechanic.phone } : (b.mechanic || null),
    serviceCenter: serviceCenter ? { id: serviceCenter.id, name: serviceCenter.name, city: serviceCenter.city, address: serviceCenter.address } : (b.serviceCenter || null),
    repairLogs,
    diagnostics,
    inspection,
    images,
    partsRequests,
    chatMessages,
    invoice,
    feedback
  };
}

// 1. Mechanic Profile & Performance Dashboard
export const getMechanicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.user!;

    // 1. Fetch user from Firestore as primary source of truth
    let user: any = null;
    try {
      user = await firebaseService.getUserById(userId);
    } catch (err) {
      console.warn('FirebaseService getUserById failed, attempting fallback:', err);
    }

    // Fallback to dbStore if not found in Firestore
    if (!user) {
      user = dbStore.getUserById(userId);
    }

    if (!user) {
      res.status(404).json({ message: 'Mechanic profile not found.' });
      return;
    }

    if (user.role !== 'MECHANIC' && role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: User is not a certified mechanic.' });
      return;
    }

    // 2. Fetch bookings for performance metrics
    let mechanicBookings: any[] = [];
    try {
      mechanicBookings = await firebaseService.getBookingsByMechanic(user.id);
    } catch (_) {}
    if (!mechanicBookings || mechanicBookings.length === 0) {
      mechanicBookings = dbStore.getBookingsByMechanic(user.id);
    }

    const completedBookings = mechanicBookings.filter((b: any) => b.status === 'COMPLETED');
    const activeBookings = mechanicBookings.filter(
      (b: any) => b.status === 'REPAIRING' || b.status === 'INSPECTION' || b.status === 'QUALITY_CHECK'
    );
    const pendingBookings = mechanicBookings.filter(
      (b: any) => b.status === 'ASSIGNED' || b.status === 'APPROVED' || b.status === 'PENDING'
    );

    // 3. Ratings info
    let rating = 4.9;
    let totalRatingsCount = completedBookings.length > 0 ? completedBookings.length : 12;
    try {
      const feedbacks = await firebaseService.getFeedbacksByMechanic(user.id);
      if (feedbacks && feedbacks.length > 0) {
        const sum = feedbacks.reduce((acc: number, f: any) => acc + (f.rating || 5), 0);
        rating = Number((sum / feedbacks.length).toFixed(1));
        totalRatingsCount = feedbacks.length;
      } else {
        const storeRating = dbStore.getMechanicAverageRating(user.id);
        if (storeRating && storeRating.count > 0) {
          rating = storeRating.averageRating;
          totalRatingsCount = storeRating.count;
        }
      }
    } catch (_) {}

    // 4. Efficiency score
    const efficiencyScore =
      completedBookings.length > 0
        ? Math.min(98, Math.max(88, 92 + (completedBookings.length % 7)))
        : (user.efficiencyScore || 95);

    // 5. Service center details
    let center: any = null;
    if (user.assignedServiceCenterId) {
      try {
        center =
          (await firebaseService.getDocument('serviceCenters', user.assignedServiceCenterId)) ||
          dbStore.getServiceCenterById(user.assignedServiceCenterId);
      } catch (_) {}
    }
    if (!center && !user.assignedServiceCenterId) {
      const defaultCenters = dbStore.getServiceCenters();
      center = defaultCenters[0] || null;
    }

    const cLat = typeof center?.latitude === 'number' && !isNaN(center.latitude)
      ? center.latitude
      : (typeof user.serviceCenterLatitude === 'number' && !isNaN(user.serviceCenterLatitude) ? user.serviceCenterLatitude : null);

    const cLng = typeof center?.longitude === 'number' && !isNaN(center.longitude)
      ? center.longitude
      : (typeof user.serviceCenterLongitude === 'number' && !isNaN(user.serviceCenterLongitude) ? user.serviceCenterLongitude : null);

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '+1 (555) 019-2834',
      role: user.role,
      availability: user.availability || 'AVAILABLE',
      assignedServiceCenterId: user.assignedServiceCenterId || center?.id || null,
      serviceCenterName: center?.name || user.serviceCenterName || 'FleetOps Central Technical Hub',
      serviceCenterAddress: center?.address || user.serviceCenterAddress || '100 Automotive Blvd',
      serviceCenterCity: center?.city || user.serviceCenterCity || 'San Francisco, CA',
      serviceCenterStatus: center?.workingStatus || center?.status || 'OPEN',
      serviceCenterLatitude: cLat,
      serviceCenterLongitude: cLng,
      serviceCenterPhone: center?.phoneNumber || center?.phone || user.serviceCenterPhone || null,
      assignedServiceCenter: (center || user.assignedServiceCenterId) ? {
        id: center?.id || user.assignedServiceCenterId,
        name: center?.name || user.serviceCenterName || 'FleetOps Central Technical Hub',
        address: center?.address || user.serviceCenterAddress || '100 Automotive Blvd',
        city: center?.city || user.serviceCenterCity || 'San Francisco, CA',
        latitude: cLat,
        longitude: cLng,
        phoneNumber: center?.phoneNumber || center?.phone || user.serviceCenterPhone || null,
        workingStatus: center?.workingStatus || center?.status || 'OPEN',
        averageRating: center?.averageRating ?? 4.8,
        totalReviews: center?.totalReviews ?? 24,
        experienceYears: center?.experienceYears ?? 6
      } : null,
      shiftName: user.shiftName || 'Morning Tech Bay Shift (08:00 - 17:00)',
      badgeNumber: user.badgeNumber || user.employeeId || `TECH-${user.id.slice(-4).toUpperCase()}`,
      experienceYears: user.experienceYears || user.experience || 6,
      specialties: user.specialties || (user.specialization ? [user.specialization] : ['Engine Diagnostics', 'Brake Systems', 'OBD-II Telemetry', 'EV Powertrain']),
      rating,
      totalRatingsCount,
      efficiencyScore,
      completedJobsCount: completedBookings.length,
      activeJobsCount: activeBookings.length,
      pendingJobsCount: pendingBookings.length,
      avatar: user.avatar || user.photoUrl || null,
      photoUrl: user.photoUrl || user.avatar || null
    };

    res.status(200).json({ profile });
  } catch (error: any) {
    console.error('getMechanicProfile error:', error);
    res.status(500).json({ message: 'Server error fetching mechanic profile', error: error.message });
  }
};

export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const callerId = req.user!.userId;
    const callerRole = req.user!.role;
    const requestedMechanicId = req.body?.mechanicId || req.params?.mechanicId || req.query?.mechanicId;

    // Security check: Mechanic isolation - a mechanic cannot update another mechanic's availability
    if (callerRole === 'MECHANIC' && requestedMechanicId && requestedMechanicId !== callerId) {
      res.status(403).json({ message: 'Forbidden: You cannot modify another mechanic’s availability.' });
      return;
    }

    const targetMechanicId = callerRole === 'ADMIN' && requestedMechanicId ? requestedMechanicId : callerId;
    const { availability } = req.body;

    const validStatuses: MechanicAvailabilityStatus[] = ['AVAILABLE', 'BUSY', 'OFFLINE'];
    if (!validStatuses.includes(availability)) {
      res.status(400).json({ message: 'Invalid availability status. Allowed: AVAILABLE, BUSY, OFFLINE' });
      return;
    }

    // 1. Fetch target user from Firestore as primary source of truth
    let user: any = null;
    try {
      user = await firebaseService.getUserById(targetMechanicId);
    } catch (err) {
      console.warn('FirebaseService getUserById failed, attempting fallback:', err);
    }

    // Fallback to dbStore if not found in Firestore
    if (!user) {
      user = dbStore.getUserById(targetMechanicId);
    }

    if (!user) {
      res.status(404).json({ message: 'Mechanic not found' });
      return;
    }

    if (user.role !== 'MECHANIC' && callerRole !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: Target user is not a certified mechanic.' });
      return;
    }

    // 2. Update Firestore user document
    let updatedUser: any = null;
    try {
      updatedUser = await firebaseService.updateDocument('users', targetMechanicId, {
        availability
      });
    } catch (err) {
      console.error('Failed to update Firestore user availability:', err);
    }

    // 3. Update in-memory dbStore if present
    const dbStoreUpdated = dbStore.updateMechanicAvailability(targetMechanicId, availability);
    if (!updatedUser && dbStoreUpdated) {
      updatedUser = dbStoreUpdated;
    } else if (updatedUser && dbStoreUpdated) {
      // both updated
    } else if (!updatedUser && !dbStoreUpdated) {
      res.status(500).json({ message: 'Failed to update availability in storage.' });
      return;
    }

    const finalUser = updatedUser || {
      ...user,
      availability
    };

    const { password: _, ...safeUser } = finalUser;

    // 4. Broadcast existing availability update to admin room
    broadcastEvent('mechanic:availability_change', {
      mechanicId: targetMechanicId,
      mechanicName: safeUser.name || 'Mechanic',
      availability
    });

    res.status(200).json({
      message: `Availability updated to ${availability}`,
      availability,
      user: safeUser
    });
  } catch (error: any) {
    console.error('updateAvailability error:', error);
    res.status(500).json({ message: 'Server error updating availability', error: error.message });
  }
};

export const getMechanicPerformance = (req: Request, res: Response): void => {
  const { userId } = req.user!;
  const metrics = dbStore.getMechanicPerformanceMetrics(userId);
  const ratingInfo = dbStore.getMechanicAverageRating(userId);

  res.status(200).json({
    metrics: {
      ...metrics,
      completedJobs: metrics.totalCompletedRepairs || 18,
      avgRepairTime: `${metrics.avgRepairTimeHours || 1.8} hrs`,
      customerRating: ratingInfo.averageRating > 0 ? ratingInfo.averageRating : 4.9,
      efficiencyScore: `${metrics.efficiencyScore || 96}%`
    }
  });
};

// 2. Advanced Job Management
export const getAssignedJobs = async (req: Request, res: Response): Promise<void> => {
  const { userId, role } = req.user!;

  let dbStoreBookings = dbStore.getBookings();
  if (role === 'MECHANIC') {
    dbStoreBookings = dbStoreBookings.filter((b) => b.mechanicId === userId || b.assignedMechanicId === userId);
  }

  let firestoreBookings: any[] = [];
  try {
    if (role === 'MECHANIC') {
      firestoreBookings = await firebaseService.getBookingsByMechanic(userId);
    } else {
      firestoreBookings = await firebaseService.getCollection('bookings');
    }
  } catch (err) {
    console.error('getAssignedJobs error querying Firestore:', err);
  }

  // Deduplicate and merge, prioritizing Firestore as the source for real customer bookings
  const bookingMap = new Map<string, any>();
  for (const b of dbStoreBookings) {
    bookingMap.set(b.id, b);
  }
  for (const fb of firestoreBookings) {
    const existing = bookingMap.get(fb.id);
    bookingMap.set(fb.id, existing ? { ...existing, ...fb } : fb);
  }

  const combinedBookings = Array.from(bookingMap.values());

  const fullyEnriched = await Promise.all(
    combinedBookings.map(async (b) => {
      let vehicle = b.vehicle || dbStore.getVehicleById(b.vehicleId);
      if (!vehicle && b.vehicleId) {
        try {
          vehicle = await firebaseService.getDocument('vehicles', b.vehicleId);
        } catch (_) {}
      }

      let customer = b.customer || dbStore.getUserById(b.customerId);
      if (!customer && b.customerId) {
        try {
          customer = await firebaseService.getUserById(b.customerId);
        } catch (_) {}
      }

      let mechanic = b.mechanic || (b.mechanicId ? dbStore.getUserById(b.mechanicId) : null);
      if (!mechanic && (b.mechanicId || b.assignedMechanicId)) {
        try {
          mechanic = await firebaseService.getUserById(b.mechanicId || b.assignedMechanicId);
        } catch (_) {}
      }

      return enrichJobWithDetails({
        ...b,
        vehicle,
        customer,
        mechanic
      });
    })
  );

  res.status(200).json({
    jobs: fullyEnriched,
    tasks: fullyEnriched,
    bookings: fullyEnriched,
    count: fullyEnriched.length
  });
};

export const getJobDetail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  let booking = dbStore.getBookingById(id);
  if (!booking) {
    try {
      booking = await firebaseService.getDocument('bookings', id);
    } catch (err) {
      console.error('getJobDetail error querying Firestore:', err);
    }
  }

  if (!booking) {
    res.status(404).json({ message: 'Work order or booking not found.' });
    return;
  }

  const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
  if (role === 'MECHANIC' && !isAssignedToMe) {
    res.status(403).json({ message: 'Forbidden: You are not assigned to this job.' });
    return;
  }

  let vehicle = (booking as any).vehicle || dbStore.getVehicleById(booking.vehicleId);
  if (!vehicle && booking.vehicleId) {
    try {
      vehicle = await firebaseService.getDocument('vehicles', booking.vehicleId);
    } catch (_) {}
  }

  let customer = (booking as any).customer || dbStore.getUserById(booking.customerId);
  if (!customer && booking.customerId) {
    try {
      customer = await firebaseService.getUserById(booking.customerId);
    } catch (_) {}
  }

  let mechanic = (booking as any).mechanic || (booking.mechanicId ? dbStore.getUserById(booking.mechanicId) : null);
  if (!mechanic && (booking.mechanicId || booking.assignedMechanicId)) {
    try {
      mechanic = await firebaseService.getUserById(booking.mechanicId || booking.assignedMechanicId);
    } catch (_) {}
  }

  const enriched = enrichJobWithDetails({
    ...booking,
    vehicle,
    customer,
    mechanic
  });

  res.status(200).json({
    job: enriched,
    task: enriched,
    booking: enriched
  });
};

export const updateJobStatus = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    return;
  }

  const id = req.params.id || req.body.id || req.body.bookingId;
  const { status, mileage, notes, progressPercentage } = req.body;
  const { userId, role } = req.user!;

  if (!id) {
    res.status(400).json({ message: 'Booking ID or Work order ID is required.' });
    return;
  }

  const targetStatus = (status as string).toUpperCase() as BookingStatus;
  let booking = dbStore.getBookingById(id);
  if (!booking) {
    try {
      booking = await firebaseService.getDocument('bookings', id);
    } catch (_) {}
  }

  if (!booking) {
    res.status(404).json({ message: 'Work order not found.' });
    return;
  }

  const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
  if (role === 'MECHANIC') {
    if (!isAssignedToMe) {
      res.status(403).json({ message: 'Forbidden: You can only update jobs assigned to you.' });
      return;
    }

    if (!canMechanicUpdateStatus(targetStatus)) {
      res.status(403).json({
        message: `Forbidden: Mechanics may only transition to approved workflow statuses. Attempted: ${targetStatus}`
      });
      return;
    }

    if (!canMechanicTransition(booking.status, targetStatus)) {
      res.status(403).json({
        message: `Forbidden: Mechanics may only perform workflow transitions: ASSIGNED -> INSPECTION -> REPAIRING -> QUALITY_CHECK -> COMPLETED. Cannot transition from ${booking.status} to ${targetStatus}.`
      });
      return;
    }
  }

  // Validate status transition
  const validation = validateBookingStatusTransition(booking.status, targetStatus);
  if (!validation.valid) {
    res.status(400).json({ message: validation.reason });
    return;
  }

  let updated = null;
  let dbStoreUpdated = false;
  if (dbStore.getBookingById(id)) {
    updated = dbStore.updateBookingStatus(id, targetStatus);
    dbStoreUpdated = !!updated;
  }

  let firestoreUpdated = false;
  const firestoreUpdates: any = { status: targetStatus };
  if (progressPercentage !== undefined) {
    firestoreUpdates.progressPercentage = Number(progressPercentage);
  }
  if (mileage !== undefined && mileage !== null) {
    firestoreUpdates.mileage = Number(mileage);
  }

  try {
    const fbResult = await firebaseService.updateDocument('bookings', id, firestoreUpdates);
    firestoreUpdated = !!fbResult;
  } catch (e) {
    console.error('Failed to update Firestore job status:', e);
  }

  if (!dbStoreUpdated && !firestoreUpdated) {
    res.status(500).json({ message: 'Failed to update job status in storage.' });
    return;
  }

  const finalBooking = updated || {
    ...booking,
    ...firestoreUpdates,
    updatedAt: new Date().toISOString()
  };

  const mechanicUser = dbStore.getUserById(userId) || (await (async () => {
    try {
      return await firebaseService.getUserById(userId);
    } catch (_) {
      return null;
    }
  })());

  let vehicle = (finalBooking as any).vehicle || dbStore.getVehicleById(finalBooking.vehicleId);
  if (!vehicle && finalBooking.vehicleId) {
    try {
      vehicle = await firebaseService.getDocument('vehicles', finalBooking.vehicleId);
    } catch (_) {}
  }

  let customer = (finalBooking as any).customer || dbStore.getUserById(finalBooking.customerId);
  if (!customer && finalBooking.customerId) {
    try {
      customer = await firebaseService.getUserById(finalBooking.customerId);
    } catch (_) {}
  }

  let mechanic = (finalBooking as any).mechanic || (finalBooking.mechanicId ? dbStore.getUserById(finalBooking.mechanicId) : null);
  if (!mechanic && (finalBooking.mechanicId || finalBooking.assignedMechanicId)) {
    try {
      mechanic = await firebaseService.getUserById(finalBooking.mechanicId || finalBooking.assignedMechanicId);
    } catch (_) {}
  }

  const vehicleLabel = vehicle
    ? `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber || vehicle.licensePlate || ''})`
    : 'Vehicle';

  // Handle vehicle mileage update & reminder reset upon completion
  if (targetStatus === 'COMPLETED') {
    try {
      dbStore.recordVehicleServiceCompletion(
        booking.vehicleId,
        new Date().toISOString().split('T')[0],
        mileage !== undefined && mileage !== null ? Number(mileage) : undefined
      );
    } catch (e) {
      console.error('Failed to update vehicle service completion record:', e);
    }
  }

  // Add auto-generated or custom repair log note if provided
  if (notes || targetStatus) {
    const logNote = notes || `Status changed from ${booking.status} to ${targetStatus}`;
    dbStore.addWorkshopRepairLog({
      bookingId: id,
      action: `Status: ${targetStatus}`,
      note: logNote,
      progressPercentage: progressPercentage !== undefined ? Number(progressPercentage) : undefined,
      updatedBy: userId
    });
  }

  // Real-time socket notification & notification table dispatch
  try {
    const statusMsgMap: Record<string, string> = {
      APPROVED: `Work order has been accepted and scheduled for inspection.`,
      INSPECTION: `Multi-point safety inspection and OBD-II diagnostics in progress.`,
      REPAIRING: `Active mechanical repairs and service work in progress.`,
      QUALITY_CHECK: `Repairs completed. Final road-test and quality inspection in progress.`,
      COMPLETED: `Maintenance work on ${vehicleLabel} completed and ready for pickup!`,
      CANCELLED: `Service order has been cancelled.`
    };

    const statusMessage = statusMsgMap[targetStatus] || `Job status updated to ${targetStatus}`;

    await notificationService.createNotification({
      userId: booking.customerId,
      title: `Service Status: ${targetStatus.replace('_', ' ')}`,
      message: statusMessage,
      type: targetStatus === 'COMPLETED' ? 'SERVICE_COMPLETED' : 'SERVICE_PROGRESS_UPDATE',
      link: '/my-bookings',
      data: { bookingId: booking.id, vehicleId: booking.vehicleId, status: targetStatus }
    });

    const socketPayload = {
      bookingId: booking.id,
      status: targetStatus,
      message: statusMessage,
      updatedAt: new Date().toISOString()
    };

    sendToUser(booking.customerId, 'status_updated', socketPayload);
    sendToRole('ADMIN', 'status_updated', socketPayload);
    if (booking.mechanicId) {
      sendToUser(booking.mechanicId, 'status_updated', socketPayload);
    }
    if (booking.assignedMechanicId && booking.assignedMechanicId !== booking.mechanicId) {
      sendToUser(booking.assignedMechanicId, 'status_updated', socketPayload);
    }

    if (targetStatus === 'COMPLETED') {
      await notificationService.notifyRole('ADMIN', {
        title: 'Job Completed by Workshop',
        message: `Work order #${booking.id.slice(-6)} completed for ${vehicleLabel} by ${mechanicUser?.name || 'Mechanic'}.`,
        type: 'SERVICE_COMPLETED',
        link: '/admin',
        data: { bookingId: booking.id, vehicleId: booking.vehicleId }
      });
    }
  } catch (notifErr) {
    console.error('Failed to dispatch status update notification:', notifErr);
  }

  // Record audit log
  dbStore.addAuditLog({
    action: 'UPDATE_SERVICE_STATUS',
    performedBy: userId,
    performedByName: mechanicUser?.name || 'Mechanic',
    performedByRole: role,
    targetType: 'BOOKING',
    targetId: id,
    details: `${role === 'ADMIN' ? 'Administrator' : 'Mechanic ' + (mechanicUser?.name || 'Technician')} updated booking ${id} status from ${booking.status} to ${targetStatus}.`,
    status: 'SUCCESS'
  });

  const enriched = enrichJobWithDetails({
    ...finalBooking,
    vehicle,
    customer,
    mechanic: mechanic || mechanicUser
  });

  res.status(200).json({
    message: `Job status successfully updated to ${targetStatus}`,
    booking: enriched,
    job: enriched,
    task: enriched
  });
};

export const acceptJob = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  let booking = dbStore.getBookingById(id);
  if (!booking) {
    try {
      booking = await firebaseService.getDocument('bookings', id);
    } catch (_) {}
  }

  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  // Ownership verification: mechanic must be assigned to this booking
  const isAssigned =
    booking.mechanicId === userId ||
    booking.assignedMechanicId === userId;

  if (role === 'MECHANIC' && !isAssigned) {
    res.status(403).json({ message: 'Forbidden: You can only accept jobs assigned to you.' });
    return;
  }

  // Status verification: only bookings in ASSIGNED status can be accepted by mechanics
  if (booking.status !== 'ASSIGNED') {
    res.status(400).json({
      message: `Invalid action: Only bookings in ASSIGNED status can be accepted. Current status is ${booking.status}.`
    });
    return;
  }

  // Idempotency: prevent duplicate acceptance, duplicate logs, notifications, and socket events
  const dbLogs = dbStore.getRepairLogsByBooking(id) || [];
  const bLogs = Array.isArray((booking as any).repairLogs) ? (booking as any).repairLogs : [];
  const allLogs = [...dbLogs, ...bLogs];
  const alreadyAccepted = allLogs.some((l: any) => l.action === 'Job Accepted');
  if (alreadyAccepted) {
    res.status(400).json({ message: 'Job has already been accepted.' });
    return;
  }

  const mechanicUser = dbStore.getUserById(userId) || (await (async () => {
    try {
      return await firebaseService.getUserById(userId);
    } catch (_) {
      return null;
    }
  })());

  let updated = null;
  if (dbStore.getBookingById(id)) {
    updated = dbStore.updateBooking(id, {
      mechanicId: userId,
      assignedMechanicId: userId,
      assignedMechanicName: mechanicUser?.name || 'Technician',
      status: 'ASSIGNED'
    });
  }

  try {
    await firebaseService.updateDocument('bookings', id, {
      mechanicId: userId,
      assignedMechanicId: userId,
      assignedMechanicName: mechanicUser?.name || 'Technician',
      status: 'ASSIGNED'
    });
  } catch (e) {
    console.error('Failed to update Firestore job in acceptJob:', e);
  }

  dbStore.addWorkshopRepairLog({
    bookingId: id,
    action: 'Job Accepted',
    note: `Technician ${mechanicUser?.name || 'Mechanic'} accepted and initiated workspace diagnostic bay.`,
    updatedBy: userId
  });

  // Notify customer
  await notificationService.createNotification({
    userId: booking.customerId,
    title: 'Technician Assigned',
    message: `Master Technician ${mechanicUser?.name || 'Specialist'} has accepted your vehicle service and prepared the bay.`,
    type: 'MECHANIC_ASSIGNED',
    link: '/my-bookings',
    data: { bookingId: booking.id, mechanicId: userId }
  });

  // Real-time socket notification using canonical status_updated event
  try {
    const socketPayload = {
      bookingId: booking.id,
      status: 'ASSIGNED',
      action: 'Job Accepted',
      message: `Technician ${mechanicUser?.name || 'Mechanic'} has accepted the job.`,
      updatedAt: new Date().toISOString()
    };
    sendToUser(booking.customerId, 'status_updated', socketPayload);
    sendToRole('ADMIN', 'status_updated', socketPayload);
    if (booking.mechanicId) {
      sendToUser(booking.mechanicId, 'status_updated', socketPayload);
    }
    if (booking.assignedMechanicId && booking.assignedMechanicId !== booking.mechanicId) {
      sendToUser(booking.assignedMechanicId, 'status_updated', socketPayload);
    }
  } catch (socketErr) {
    console.error('Failed to emit status_updated in acceptJob:', socketErr);
  }

  const finalBooking = updated || {
    ...booking,
    mechanicId: userId,
    assignedMechanicId: userId,
    assignedMechanicName: mechanicUser?.name || 'Technician',
    status: 'ASSIGNED',
    updatedAt: new Date().toISOString()
  };

  let vehicle = (finalBooking as any).vehicle || dbStore.getVehicleById(finalBooking.vehicleId);
  if (!vehicle && finalBooking.vehicleId) {
    try {
      vehicle = await firebaseService.getDocument('vehicles', finalBooking.vehicleId);
    } catch (_) {}
  }

  let customer = (finalBooking as any).customer || dbStore.getUserById(finalBooking.customerId);
  if (!customer && finalBooking.customerId) {
    try {
      customer = await firebaseService.getUserById(finalBooking.customerId);
    } catch (_) {}
  }

  const enriched = enrichJobWithDetails({
    ...finalBooking,
    vehicle,
    customer,
    mechanic: mechanicUser
  });

  res.status(200).json({
    message: 'Job successfully accepted and staged for inspection.',
    job: enriched
  });
};

// 3. OBD-II Diagnostics Panel
export const getDiagnostics = async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.params;
  const { userId, role } = req.user!;

  let booking = dbStore.getBookingById(bookingId);
  if (!booking) {
    try {
      booking = await firebaseService.getDocument('bookings', bookingId);
    } catch (_) {}
  }

  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
  if (role === 'MECHANIC' && !isAssignedToMe) {
    res.status(403).json({ message: 'Forbidden: You can only view diagnostics for your assigned jobs.' });
    return;
  }

  let diagnostics = dbStore.getDiagnosticsByBooking(bookingId);
  if (!diagnostics || diagnostics.length === 0) {
    try {
      const fsDiagnostics = await firebaseService.getCollection('diagnostics', [{ field: 'bookingId', op: '==', value: bookingId }]);
      if (fsDiagnostics && fsDiagnostics.length > 0) {
        diagnostics = fsDiagnostics;
        // Hydrate dbStore cache if missing
        for (const d of fsDiagnostics) {
          if (!dbStore.getDiagnosticsByBooking(bookingId).some(x => x.id === d.id)) {
            dbStore.addDiagnostic(d);
          }
        }
      }
    } catch (_) {}
  }
  res.status(200).json({ diagnostics: diagnostics || [] });
};

export const addDiagnostic = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    return;
  }

  const { userId, role } = req.user!;
  const mechanic = dbStore.getUserById(userId);
  const { bookingId, vehicleId, faultCode, systemCategory, problemDescription, severity, recommendedSolution } = req.body;

  let booking = dbStore.getBookingById(bookingId);
  if (!booking) {
    try {
      booking = await firebaseService.getDocument('bookings', bookingId);
    } catch (_) {}
  }

  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
  if (role === 'MECHANIC' && !isAssignedToMe) {
    res.status(403).json({ message: 'Forbidden: You can only diagnose your assigned jobs.' });
    return;
  }

  const newRecord = dbStore.addDiagnostic({
    bookingId,
    vehicleId: vehicleId || booking.vehicleId,
    mechanicId: userId,
    mechanicName: mechanic?.name || 'Technician',
    faultCode: faultCode.toUpperCase(),
    systemCategory: systemCategory || 'POWERTRAIN',
    problemDescription,
    severity: severity || 'MEDIUM',
    recommendedSolution
  });

  // Persist to Firestore 'diagnostics' collection
  try {
    await firebaseService.createDocument('diagnostics', newRecord, newRecord.id);
  } catch (e) {
    console.error('Failed to sync diagnostic record to Firestore:', e);
  }

  // Log in repair workspace
  const repairLog = dbStore.addWorkshopRepairLog({
    bookingId,
    action: 'OBD-II Fault Detected',
    note: `DTC Code [${faultCode.toUpperCase()}] logged (${severity}): ${problemDescription}. Solution: ${recommendedSolution}`,
    updatedBy: userId
  });

  try {
    await firebaseService.createDocument('repairLogs', repairLog, repairLog.id);
  } catch (e) {
    console.error('Failed to sync diagnostic repair log to Firestore:', e);
  }

  // If Critical/High severity, notify customer immediately
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    try {
      await notificationService.createNotification({
        userId: booking.customerId,
        title: `Diagnostic Alert: ${faultCode.toUpperCase()}`,
        message: `Diagnostic telemetry detected ${severity.toLowerCase()} issue: ${problemDescription}.`,
        type: 'SYSTEM_ALERT',
        link: '/my-bookings',
        data: { bookingId, faultCode, severity }
      });
    } catch (e) {
      console.error('Failed to notify customer of critical DTC:', e);
    }
  }

  res.status(201).json({
    message: 'DTC diagnostic code recorded successfully.',
    diagnostic: newRecord
  });
};

export const resolveDiagnostic = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const resolved = dbStore.resolveDiagnostic(id);
  if (!resolved) {
    res.status(404).json({ message: 'Diagnostic record not found.' });
    return;
  }

  try {
    await firebaseService.updateDocument('diagnostics', id, {
      status: 'RESOLVED',
      resolvedAt: resolved.resolvedAt || new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to sync diagnostic resolution to Firestore:', e);
  }

  res.status(200).json({
    message: 'Diagnostic fault marked as resolved.',
    diagnostic: resolved
  });
};

export const deleteDiagnostic = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = dbStore.deleteDiagnostic(id);
  if (!deleted) {
    res.status(404).json({ message: 'Diagnostic record not found.' });
    return;
  }

  try {
    await firebaseService.deleteDocument('diagnostics', id);
  } catch (e) {
    console.error('Failed to sync diagnostic deletion to Firestore:', e);
  }

  res.status(200).json({ message: 'Diagnostic fault removed.' });
};

// 4. Vehicle Inspection & Health Module
export const getInspection = async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.params;
  let inspection = dbStore.getInspectionByBooking(bookingId);
  if (!inspection) {
    try {
      const fbBooking = await firebaseService.getDocument('bookings', bookingId);
      if (fbBooking && fbBooking.inspection) {
        inspection = fbBooking.inspection;
      }
    } catch (_) {}
  }
  res.status(200).json({ inspection });
};

export const saveInspection = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    return;
  }

  const { userId, role } = req.user!;
  const mechanic = dbStore.getUserById(userId);
  const bookingId = req.body.bookingId || req.params.id;
  const {
    vehicleId,
    engineHealthScore,
    batteryVoltage,
    batteryHealthPercent,
    brakeWearPercent,
    tireCondition,
    tireTreadDepthMm,
    overallResult,
    items,
    summaryNotes
  } = req.body;

  let booking = dbStore.getBookingById(bookingId);
  if (!booking) {
    try {
      booking = await firebaseService.getDocument('bookings', bookingId);
    } catch (_) {}
  }

  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
  if (role === 'MECHANIC' && !isAssignedToMe) {
    res.status(403).json({ message: 'Forbidden: You can only inspect your assigned jobs.' });
    return;
  }

  const report = dbStore.saveInspection({
    bookingId,
    vehicleId: vehicleId || booking.vehicleId,
    mechanicId: userId,
    mechanicName: mechanic?.name || 'Technician',
    engineHealthScore: Number(engineHealthScore) || 90,
    batteryVoltage: batteryVoltage || '12.6V',
    batteryHealthPercent: Number(batteryHealthPercent) || 95,
    brakeWearPercent: Number(brakeWearPercent) || 25,
    tireCondition: tireCondition || 'GOOD',
    tireTreadDepthMm: Number(tireTreadDepthMm) || 5.5,
    overallResult: overallResult || 'PASS',
    items: items || [],
    summaryNotes: summaryNotes || 'Multi-point safety inspection completed.'
  });

  try {
    await firebaseService.updateDocument('bookings', bookingId, { inspection: report });
  } catch (e) {
    console.error('Failed to sync inspection to Firestore:', e);
  }

  // Log in repair workspace
  dbStore.addWorkshopRepairLog({
    bookingId,
    action: 'Multi-Point Inspection Completed',
    note: `Inspection Result: ${overallResult}. Engine Health: ${engineHealthScore}%, Battery: ${batteryVoltage} (${batteryHealthPercent}%), Brakes: ${brakeWearPercent}% wear. ${summaryNotes}`,
    updatedBy: userId
  });

  // Notify customer with inspection card
  try {
    await notificationService.createNotification({
      userId: booking.customerId,
      title: 'Vehicle Inspection Report Ready',
      message: `Technician ${mechanic?.name || 'Mechanic'} published the multi-point inspection report: Overall Status is ${overallResult}.`,
      type: 'SERVICE_PROGRESS_UPDATE',
      link: '/my-bookings',
      data: { bookingId, overallResult }
    });
  } catch (e) {
    console.error('Failed to notify customer of inspection:', e);
  }

  res.status(201).json({
    message: 'Multi-point inspection report saved successfully.',
    inspection: report
  });
};

// 5. Repair Workspace Logs
export const addRepairLog = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    return;
  }

  const id = req.params.id || req.body.bookingId;
  const { action, note, partsReplaced, hoursSpent, labourRate, labourCost, partsCost, cost, progressPercentage } = req.body;
  const { userId, role } = req.user!;

  let booking = dbStore.getBookingById(id);
  if (!booking) {
    try {
      booking = await firebaseService.getDocument('bookings', id);
    } catch (_) {}
  }

  if (!booking) {
    res.status(404).json({ message: 'Work order not found.' });
    return;
  }

  const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
  if (role === 'MECHANIC' && !isAssignedToMe) {
    res.status(403).json({ message: 'Forbidden: You can only log work on your assigned jobs.' });
    return;
  }

  const newLog = dbStore.addWorkshopRepairLog({
    bookingId: id,
    action: action || 'Repair Entry',
    note: (note || '').trim(),
    partsReplaced: partsReplaced || [],
    hoursSpent: hoursSpent !== undefined ? Number(hoursSpent) : undefined,
    labourRate: labourRate !== undefined ? Number(labourRate) : undefined,
    labourCost: labourCost !== undefined ? Number(labourCost) : undefined,
    partsCost: partsCost !== undefined ? Number(partsCost) : undefined,
    cost: cost !== undefined ? Number(cost) : undefined,
    progressPercentage: progressPercentage !== undefined ? Number(progressPercentage) : undefined,
    updatedBy: userId
  });

  try {
    await firebaseService.createDocument('repairLogs', newLog, newLog.id);
  } catch (e) {
    console.error('Failed to sync repair log to Firestore:', e);
  }

  const user = dbStore.getUserById(userId);

  // If cost was added and invoice exists, we can sync parts/service charges
  if (newLog.cost && newLog.cost > 0) {
    const existingInvoice = dbStore.getInvoiceByBookingId(id);
    if (existingInvoice) {
      const addedParts = newLog.partsCost || 0;
      const addedLabor = newLog.labourCost || 0;
      const newService = existingInvoice.serviceCharges + addedLabor;
      const newParts = existingInvoice.partsCost + addedParts;
      const newTax = Math.round((newService + newParts) * 0.1);
      const newTotal = newService + newParts + newTax;
      dbStore.updateInvoice(existingInvoice.id, {
        serviceCharges: newService,
        partsCost: newParts,
        tax: newTax,
        amount: newTotal
      });
    }
  }

  res.status(201).json({
    message: 'Repair workspace log added successfully.',
    repairLog: {
      ...newLog,
      updatedByUser: user ? { id: user.id, name: user.name, role: user.role } : null
    }
  });
};

// 6. Repair Images Upload System
export const getRepairImages = (req: Request, res: Response): void => {
  const { bookingId } = req.params;
  const images = dbStore.getRepairImagesByBooking(bookingId);
  res.status(200).json({ images });
};

export const uploadRepairImage = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    return;
  }

  const { userId, role } = req.user!;
  const mechanic = dbStore.getUserById(userId);
  const { bookingId, vehicleId, category, imageUrl, caption, isApprovedForCustomer } = req.body;

  let booking = dbStore.getBookingById(bookingId);
  if (!booking) {
    try {
      booking = await firebaseService.getDocument('bookings', bookingId);
    } catch (_) {}
  }

  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
  if (role === 'MECHANIC' && !isAssignedToMe) {
    res.status(403).json({ message: 'Forbidden: You can only upload images for your assigned jobs.' });
    return;
  }

  const newImg = dbStore.addRepairImage({
    bookingId,
    vehicleId: vehicleId || booking.vehicleId,
    uploadedBy: userId,
    uploadedByName: mechanic?.name || 'Technician',
    category: category || 'DIAGNOSTIC',
    imageUrl,
    caption: caption || 'Workshop Inspection Photo',
    isApprovedForCustomer: isApprovedForCustomer !== undefined ? Boolean(isApprovedForCustomer) : true
  });

  // Log in workspace
  dbStore.addWorkshopRepairLog({
    bookingId,
    action: `Photo Attached (${category})`,
    note: `Attached ${category.toLowerCase()} image: "${caption}". Visible to customer: ${isApprovedForCustomer ? 'Yes' : 'No'}`,
    updatedBy: userId
  });

  res.status(201).json({
    message: 'Repair image uploaded successfully.',
    image: newImg
  });
};

export const deleteRepairImage = (req: Request, res: Response): void => {
  const { id } = req.params;
  const deleted = dbStore.deleteRepairImage(id);
  if (!deleted) {
    res.status(404).json({ message: 'Image record not found.' });
    return;
  }
  res.status(200).json({ message: 'Repair image removed.' });
};

export const toggleImageApproval = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { isApproved } = req.body;
  const updated = dbStore.toggleRepairImageCustomerApproval(id, Boolean(isApproved));
  if (!updated) {
    res.status(404).json({ message: 'Image record not found.' });
    return;
  }
  res.status(200).json({
    message: `Customer visibility updated to ${isApproved ? 'Visible' : 'Hidden'}`,
    image: updated
  });
};

// 7. Spare Parts Request Module
export const getSparePartsCatalog = (req: Request, res: Response): void => {
  const { search } = req.query;
  const parts = dbStore.getSparePartsCatalog(search as string);
  res.status(200).json({ parts });
};

export const getSparePartsRequests = async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.query;
  const { userId, role } = req.user!;

  let requests;
  if (bookingId) {
    let booking = dbStore.getBookingById(bookingId as string);
    if (!booking) {
      try {
        booking = await firebaseService.getDocument('bookings', bookingId as string);
      } catch (_) {}
    }

    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
    if (role === 'MECHANIC' && !isAssignedToMe) {
      res.status(403).json({ message: 'Forbidden: You can only view parts requests for your assigned jobs.' });
      return;
    }

    requests = dbStore.getSparePartsRequestsByBooking(bookingId as string);
    if (!requests || requests.length === 0) {
      try {
        const fsRequests = await firebaseService.getCollection('sparePartsRequests', [{ field: 'bookingId', op: '==', value: bookingId as string }]);
        if (fsRequests && fsRequests.length > 0) {
          requests = fsRequests;
          for (const r of fsRequests) {
            if (!dbStore.getSparePartsRequestsByBooking(bookingId as string).some(x => x.id === r.id)) {
              dbStore.createSparePartsRequest(r);
            }
          }
        }
      } catch (_) {}
    }
  } else if (role === 'MECHANIC') {
    requests = dbStore.getSparePartsRequestsByMechanic(userId);
    if (!requests || requests.length === 0) {
      try {
        const fsRequests = await firebaseService.getCollection('sparePartsRequests', [{ field: 'mechanicId', op: '==', value: userId }]);
        if (fsRequests && fsRequests.length > 0) {
          requests = fsRequests;
          for (const r of fsRequests) {
            if (!dbStore.getSparePartsRequestsByMechanic(userId).some(x => x.id === r.id)) {
              dbStore.createSparePartsRequest(r);
            }
          }
        }
      } catch (_) {}
    }
  } else {
    requests = dbStore.getSparePartsRequestsByMechanic(userId);
  }

  res.status(200).json({ requests: requests || [] });
};

export const createSparePartsRequest = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    return;
  }

  const { userId, role } = req.user!;
  const mechanic = dbStore.getUserById(userId);
  const { bookingId, vehicleId, partId, partName, partCode, quantityRequired, unitCost, urgency, notes } = req.body;

  let booking = dbStore.getBookingById(bookingId);
  if (!booking) {
    try {
      booking = await firebaseService.getDocument('bookings', bookingId);
    } catch (_) {}
  }

  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
  if (role === 'MECHANIC' && !isAssignedToMe) {
    res.status(403).json({ message: 'Forbidden: You can only request parts for your assigned jobs.' });
    return;
  }

  const qty = Number(quantityRequired);
  if (isNaN(qty) || qty <= 0) {
    res.status(400).json({ message: 'Invalid quantity: Quantity must be a positive number greater than 0.' });
    return;
  }

  const price = Number(unitCost) || 50;
  const total = qty * price;

  const request = dbStore.createSparePartsRequest({
    bookingId,
    vehicleId: vehicleId || booking.vehicleId,
    mechanicId: userId,
    mechanicName: mechanic?.name || 'Technician',
    partId: partId || `part-${Date.now()}`,
    partName,
    partCode: partCode || 'PART-GEN-01',
    quantityRequired: qty,
    unitCost: price,
    totalCost: total,
    urgency: urgency || 'NORMAL',
    notes: notes || 'Required for workshop service'
  });

  // Persist spare parts request to Firestore
  try {
    await firebaseService.createDocument('sparePartsRequests', request, request.id);
  } catch (e) {
    console.error('Failed to sync spare parts request to Firestore:', e);
  }

  // Log in workspace
  const repairLog = dbStore.addWorkshopRepairLog({
    bookingId,
    action: 'Parts Requisition Submitted',
    note: `Requested ${qty}x ${partName} (${partCode || 'N/A'}) - Total: $${total}. Urgency: ${urgency}`,
    updatedBy: userId
  });

  try {
    await firebaseService.createDocument('repairLogs', repairLog, repairLog.id);
  } catch (e) {
    console.error('Failed to sync parts request repair log to Firestore:', e);
  }

  // Notify Admin/Inventory manager
  await notificationService.notifyRole('ADMIN', {
    title: 'Spare Parts Requisition',
    message: `Technician ${mechanic?.name || 'Mechanic'} requested ${qty}x ${partName} ($${total}) for Work Order #${bookingId.slice(-6)}.`,
    type: 'SYSTEM_ALERT',
    link: '/admin',
    data: { bookingId, requestId: request.id }
  });

  res.status(201).json({
    message: 'Spare parts requisition logged successfully.',
    request
  });
};

export const updateSparePartsRequestStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const updated = dbStore.updateSparePartsRequestStatus(id, status);
  if (!updated) {
    res.status(404).json({ message: 'Parts request not found.' });
    return;
  }

  try {
    await firebaseService.updateDocument('sparePartsRequests', id, {
      status,
      updatedAt: updated.updatedAt || new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to sync spare parts request status to Firestore:', e);
  }

  res.status(200).json({
    message: `Parts request status updated to ${status}`,
    request: updated
  });
};

// 8. Workshop Chat & Customer Communication
export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const { userId, role } = req.user!;

    let booking = dbStore.getBookingById(bookingId);
    if (!booking) {
      try {
        booking = await firebaseService.getDocument('bookings', bookingId);
      } catch (_) {}
    }

    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
    if (role === 'MECHANIC' && !isAssignedToMe) {
      res.status(403).json({ message: 'Forbidden: You can only view chat for your assigned jobs.' });
      return;
    }

    let messages = dbStore.getChatMessagesByBooking(bookingId);
    if (!messages || messages.length === 0) {
      try {
        const fsMessages = await firebaseService.getCollection('chatMessages', [{ field: 'bookingId', op: '==', value: bookingId }]);
        if (fsMessages && fsMessages.length > 0) {
          messages = fsMessages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
      } catch (_) {}
    }

    res.status(200).json({ messages: messages || [] });
  } catch (error: any) {
    console.error('getChatMessages error:', error);
    res.status(500).json({ message: 'Server error retrieving chat messages', error: error.message });
  }
};

export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { bookingId } = req.params;
    const { message, imageUrl, type, actionPayload } = req.body;
    const { userId, role } = req.user!;

    if (!message || !message.trim()) {
      res.status(400).json({ message: 'Message content cannot be empty' });
      return;
    }

    // 1. Lookup booking in dbStore, and if not found, in Firestore
    let booking = dbStore.getBookingById(bookingId);
    if (!booking) {
      try {
        booking = await firebaseService.getDocument('bookings', bookingId);
      } catch (_) {}
    }

    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    // 2. SECURITY: Verify that mechanic is assigned to the booking
    const isAssignedToMe = booking.mechanicId === userId || booking.assignedMechanicId === userId;
    if (role === 'MECHANIC' && !isAssignedToMe) {
      res.status(403).json({ message: 'Forbidden: You can only chat in your assigned service bookings.' });
      return;
    }

    let user = dbStore.getUserById(userId);
    if (!user) {
      try {
        user = await firebaseService.getUserById(userId);
      } catch (_) {}
    }

    const isMechanic = role === 'MECHANIC';
    const recipientId = isMechanic ? booking.customerId : (booking.mechanicId || booking.assignedMechanicId || '');

    // 3. Add message to dbStore
    const newMsg = dbStore.addChatMessage({
      bookingId,
      senderId: userId,
      senderName: user?.name || (isMechanic ? 'Technician' : 'Customer'),
      senderRole: role,
      message: (message || '').trim(),
      imageUrl,
      type: type || (actionPayload ? 'APPROVAL_REQUEST' : imageUrl ? 'IMAGE' : 'TEXT'),
      approvalStatus: actionPayload ? 'PENDING' : undefined,
      actionPayload
    });

    // 4. Persist to existing Firestore 'chatMessages' collection
    try {
      await firebaseService.createDocument('chatMessages', {
        bookingId,
        senderId: userId,
        senderName: user?.name || (isMechanic ? 'Technician' : 'Customer'),
        senderRole: role,
        message: (message || '').trim(),
        imageUrl: imageUrl || null,
        type: newMsg.type,
        approvalStatus: newMsg.approvalStatus || null,
        actionPayload: actionPayload || null,
        createdAt: newMsg.createdAt || new Date().toISOString()
      }, newMsg.id);
    } catch (err) {
      console.warn('Failed persisting chat message to Firestore:', err);
    }

    // 5. Dispatch live socket events (preserving existing socket events)
    if (recipientId) {
      sendToUser(recipientId, 'message:received', {
        ...newMsg,
        bookingId
      });

      try {
        await notificationService.createNotification({
          userId: recipientId,
          title: `Message from ${user?.name || 'Workshop'}`,
          message: newMsg.type === 'APPROVAL_REQUEST'
            ? `Authorization requested: ${newMsg.message}`
            : newMsg.message.substring(0, 100),
          type: 'SERVICE_PROGRESS_UPDATE',
          link: '/my-bookings',
          data: { bookingId, messageId: newMsg.id }
        });
      } catch (err) {
        console.error('Failed to notify recipient:', err);
      }
    }

    res.status(200).json({
      message: 'Message sent successfully.',
      chatMessage: newMsg
    });
  } catch (error: any) {
    console.error('sendChatMessage error:', error);
    res.status(500).json({ message: 'Server error sending chat message', error: error.message });
  }
};

export const updateChatApproval = async (req: Request, res: Response): Promise<void> => {
  const { messageId } = req.params;
  const { approvalStatus } = req.body;

  if (approvalStatus !== 'APPROVED' && approvalStatus !== 'REJECTED') {
    res.status(400).json({ message: 'Invalid approval status. Must be APPROVED or REJECTED.' });
    return;
  }

  const updated = dbStore.updateChatMessageApproval(messageId, approvalStatus);
  if (!updated) {
    res.status(404).json({ message: 'Chat message not found.' });
    return;
  }

  // Log in workspace
  dbStore.addWorkshopRepairLog({
    bookingId: updated.bookingId,
    action: `Customer Authorization: ${approvalStatus}`,
    note: `Authorization for "${updated.message}" was ${approvalStatus.toLowerCase()} by customer.`,
    updatedBy: req.user!.userId
  });

  res.status(200).json({
    message: `Authorization response recorded: ${approvalStatus}`,
    chatMessage: updated
  });
};
