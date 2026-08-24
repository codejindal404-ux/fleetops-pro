import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { dbStore, BookingStatus } from '../services/dbStore.ts';
import { validateBookingStatusTransition } from '../utils/bookingStatusFlow.ts';
import { notificationService } from '../services/notificationService.ts';

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { vehicleId, serviceType, preferredDate, serviceCenterId } = req.body;
  const customerId = req.user!.userId;

  const vehicle = dbStore.getVehicleById(vehicleId);
  if (!vehicle) {
    res.status(404).json({ message: 'Vehicle not found.' });
    return;
  }

  // Ensure customer owns the vehicle
  if (vehicle.ownerId !== customerId) {
    res.status(403).json({ message: 'Forbidden: You can only book service for vehicles you own.' });
    return;
  }

  const booking = dbStore.createBooking({
    vehicleId,
    customerId,
    serviceCenterId: serviceCenterId || null,
    serviceType,
    preferredDate: new Date(preferredDate).toISOString()
  });

  // Enrich response with service center if available
  const serviceCenter = serviceCenterId ? dbStore.getServiceCenterById(serviceCenterId) : null;

  // Broadcast real-time notification to all Administrators
  try {
    const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : 'Vehicle';
    await notificationService.notifyRole('ADMIN', {
      title: 'New Service Booking Created',
      message: `Booking #${booking.id.slice(-6)} created for ${vehicleLabel}.`,
      type: 'BOOKING_CREATED',
      link: '/admin',
      data: { bookingId: booking.id, vehicleId: vehicle.id }
    });
  } catch (err) {
    console.error('Failed to dispatch booking creation notification:', err);
  }

  res.status(201).json({
    message: 'Booking created successfully',
    booking: {
      ...booking,
      serviceCenter
    }
  });
};

export const getBookings = async (req: Request, res: Response): Promise<void> => {
  const { userId, role } = req.user!;
  const { status, page = '1', limit = '10' } = req.query;

  let allBookings = dbStore.getBookings();

  // Role filtering
  if (role === 'CUSTOMER') {
    allBookings = dbStore.getBookingsByCustomer(userId);
  } else if (role === 'MECHANIC') {
    allBookings = dbStore.getBookingsByMechanic(userId);
  }

  // Status filter
  if (status && typeof status === 'string') {
    allBookings = allBookings.filter((b) => b.status === status.toUpperCase());
  }

  // Sorting: newest first
  allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const total = allBookings.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = allBookings.slice(startIndex, startIndex + limitNum);

  // Populate vehicle & customer details
  const enrichedBookings = paginated.map((b) => {
    const vehicle = dbStore.getVehicleById(b.vehicleId);
    const customer = dbStore.getUserById(b.customerId);
    const mechanic = b.mechanicId ? dbStore.getUserById(b.mechanicId) : null;
    const serviceCenter = b.serviceCenterId ? dbStore.getServiceCenterById(b.serviceCenterId) : null;
    return {
      ...b,
      vehicle,
      customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null,
      mechanic: mechanic ? { id: mechanic.id, name: mechanic.name, email: mechanic.email } : null,
      serviceCenter
    };
  });

  res.status(200).json({
    bookings: enrichedBookings,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
};

export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  const booking = dbStore.getBookingById(id);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  // Authorization check
  if (role === 'CUSTOMER' && booking.customerId !== userId) {
    res.status(403).json({ message: 'Forbidden: You do not have access to this booking.' });
    return;
  }

  if (role === 'MECHANIC' && booking.mechanicId !== userId && booking.status !== 'APPROVED') {
    res.status(403).json({ message: 'Forbidden: You do not have access to this booking.' });
    return;
  }

  const vehicle = dbStore.getVehicleById(booking.vehicleId);
  const customer = dbStore.getUserById(booking.customerId);
  const mechanic = booking.mechanicId ? dbStore.getUserById(booking.mechanicId) : null;
  const repairLogs = dbStore.getRepairLogsByBooking(booking.id).map((rl) => {
    const updater = dbStore.getUserById(rl.updatedBy);
    return {
      ...rl,
      updatedByUser: updater ? { id: updater.id, name: updater.name, role: updater.role } : null
    };
  });
  const invoice = dbStore.getInvoiceByBookingId(booking.id);
  const feedback = dbStore.getFeedbackByBooking(booking.id);

  res.status(200).json({
    booking: {
      ...booking,
      vehicle,
      customer: customer ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } : null,
      mechanic: mechanic ? { id: mechanic.id, name: mechanic.name, email: mechanic.email, phone: mechanic.phone } : null,
      repairLogs,
      invoice,
      feedback
    }
  });
};

export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  const { role } = req.user!;

  if (!status) {
    res.status(400).json({ message: 'Target status is required.' });
    return;
  }

  const targetStatus = (status as string).toUpperCase() as BookingStatus;
  const booking = dbStore.getBookingById(id);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  // Validate forward transition
  const validation = validateBookingStatusTransition(booking.status, targetStatus);
  if (!validation.valid) {
    res.status(400).json({ message: validation.reason });
    return;
  }

  const updated = dbStore.updateBookingStatus(id, targetStatus);

  // Trigger real-time notifications based on the new status
  try {
    const vehicle = dbStore.getVehicleById(booking.vehicleId);
    const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : `Vehicle`;

    if (targetStatus === 'APPROVED') {
      await notificationService.createNotification({
        userId: booking.customerId,
        title: 'Booking Approved',
        message: `Your service request for ${vehicleLabel} has been approved by Fleet Dispatch.`,
        type: 'BOOKING_APPROVED',
        link: '/customer',
        data: { bookingId: booking.id }
      });
    } else if (targetStatus === 'REPAIRING') {
      await notificationService.createNotification({
        userId: booking.customerId,
        title: 'Service in Progress',
        message: `Active repairs and diagnostics have commenced for ${vehicleLabel}.`,
        type: 'SERVICE_PROGRESS_UPDATE',
        link: '/customer',
        data: { bookingId: booking.id }
      });
    } else if (targetStatus === 'COMPLETED') {
      // Automatically record service completion on vehicle to reset 30-day recurring maintenance schedule
      try {
        dbStore.recordVehicleServiceCompletion(booking.vehicleId);
      } catch (e) {
        console.error('Failed to update vehicle service completion record:', e);
      }

      await notificationService.createNotification({
        userId: booking.customerId,
        title: 'Service Completed',
        message: `Maintenance work on ${vehicleLabel} is successfully completed and ready for release.`,
        type: 'SERVICE_COMPLETED',
        link: '/customer',
        data: { bookingId: booking.id }
      });
      await notificationService.notifyRole('ADMIN', {
        title: 'Service Booking Completed',
        message: `Booking #${booking.id.slice(-6)} completed for ${vehicleLabel}.`,
        type: 'SERVICE_COMPLETED',
        link: '/admin',
        data: { bookingId: booking.id }
      });
    }
  } catch (err) {
    console.error('Failed to dispatch status update notification:', err);
  }

  res.status(200).json({
    message: `Booking status updated from ${booking.status} to ${targetStatus}`,
    booking: updated
  });
};

export const assignMechanic = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const mechanicId = req.body.mechanicId || req.body.assignedMechanicId;

  if (!mechanicId) {
    res.status(400).json({ message: 'mechanicId or assignedMechanicId is required.' });
    return;
  }

  const booking = dbStore.getBookingById(id);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  const mechanic = dbStore.getUserById(mechanicId);
  if (!mechanic || mechanic.role !== 'MECHANIC') {
    res.status(400).json({ message: 'Invalid mechanicId. User must exist and have MECHANIC role.' });
    return;
  }

  // Enforce APPROVED/PENDING -> ASSIGNED when mechanic is assigned
  let nextStatus: BookingStatus = booking.status;
  if (booking.status === 'APPROVED' || booking.status === 'PENDING') {
    nextStatus = 'ASSIGNED';
  }

  const updated = dbStore.updateBookingStatus(id, nextStatus, mechanicId, mechanic.name);

  // Real-time notification to Mechanic and Customer
  try {
    const vehicle = dbStore.getVehicleById(booking.vehicleId);
    const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : `Vehicle`;

    // Notify Mechanic (exact requirement: Type: MECHANIC_ASSIGNED, Receiver: Selected mechanic, Message: "New service job assigned to your bay")
    await notificationService.createNotification({
      userId: mechanic.id,
      title: 'New Service Job Assigned',
      message: 'New service job assigned to your bay',
      type: 'MECHANIC_ASSIGNED',
      link: '/mechanic/tasks',
      data: {
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        vehicleLabel,
        serviceType: booking.serviceType
      }
    });

    // Notify Customer
    await notificationService.createNotification({
      userId: booking.customerId,
      title: 'Mechanic Assigned',
      message: `Mechanic ${mechanic.name} has been assigned to your vehicle service.`,
      type: 'MECHANIC_ASSIGNED',
      link: '/my-bookings',
      data: {
        bookingId: booking.id,
        mechanicId: mechanic.id,
        mechanicName: mechanic.name
      }
    });
  } catch (err) {
    console.error('Failed to dispatch mechanic assignment notification:', err);
  }

  res.status(200).json({
    message: `Mechanic ${mechanic.name} assigned to booking ${id}. Status set to ${nextStatus}`,
    booking: updated
  });
};

export const addRepairLog = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { note } = req.body;
  const { userId, role } = req.user!;

  if (!note || note.trim() === '') {
    res.status(400).json({ message: 'Repair log note is required.' });
    return;
  }

  const booking = dbStore.getBookingById(id);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  // Assigned MECHANIC or ADMIN
  if (role === 'MECHANIC' && booking.mechanicId !== userId) {
    res.status(403).json({ message: 'Forbidden: You can only add repair logs to bookings assigned to you.' });
    return;
  }

  const log = dbStore.addRepairLog(id, note.trim(), userId);
  res.status(201).json({ message: 'Repair log added successfully', repairLog: log });
};

export const getRepairLogs = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  const booking = dbStore.getBookingById(id);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  // Owner, assigned mechanic, or admin
  if (role === 'CUSTOMER' && booking.customerId !== userId) {
    res.status(403).json({ message: 'Forbidden: You do not have access to repair logs for this booking.' });
    return;
  }

  if (role === 'MECHANIC' && booking.mechanicId !== userId) {
    res.status(403).json({ message: 'Forbidden: You do not have access to repair logs for this booking.' });
    return;
  }

  const repairLogs = dbStore.getRepairLogsByBooking(id).map((rl) => {
    const user = dbStore.getUserById(rl.updatedBy);
    return {
      ...rl,
      updatedByUser: user ? { id: user.id, name: user.name, role: user.role } : null
    };
  });

  res.status(200).json({ repairLogs });
};

export const getAdminBookings = async (req: Request, res: Response): Promise<void> => {
  const { status, mechanicId, startDate, endDate, page = '1', limit = '10' } = req.query;

  let allBookings = dbStore.getBookings();

  if (status && typeof status === 'string') {
    allBookings = allBookings.filter((b) => b.status === status.toUpperCase());
  }

  if (mechanicId && typeof mechanicId === 'string') {
    allBookings = allBookings.filter((b) => b.mechanicId === mechanicId);
  }

  if (startDate && typeof startDate === 'string') {
    const start = new Date(startDate).getTime();
    allBookings = allBookings.filter((b) => new Date(b.preferredDate).getTime() >= start);
  }

  if (endDate && typeof endDate === 'string') {
    const end = new Date(endDate).getTime();
    allBookings = allBookings.filter((b) => new Date(b.preferredDate).getTime() <= end);
  }

  allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const total = allBookings.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = allBookings.slice(startIndex, startIndex + limitNum);

  const enriched = paginated.map((b) => ({
    ...b,
    vehicle: dbStore.getVehicleById(b.vehicleId),
    customer: dbStore.getUserById(b.customerId),
    mechanic: b.mechanicId ? dbStore.getUserById(b.mechanicId) : null
  }));

  res.status(200).json({
    bookings: enriched,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
};

export const deleteAllBookings = async (req: Request, res: Response): Promise<void> => {
  const { role } = req.user!;
  if (role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden: Only administrators can delete all bookings.' });
    return;
  }

  dbStore.deleteAllBookings();
  res.status(200).json({ message: 'All bookings deleted successfully.' });
};

export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role, userId } = req.user!;

  const booking = dbStore.getBookingById(id);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  if (role !== 'ADMIN' && booking.customerId !== userId) {
    res.status(403).json({ message: 'Forbidden: You do not have permission to delete this booking.' });
    return;
  }

  dbStore.deleteBooking(id);
  res.status(200).json({ message: `Booking '${id}' deleted successfully.` });
};
