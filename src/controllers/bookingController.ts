import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Booking, BookingStatus, RepairLog, Vehicle, User, ServiceCenter } from '../types.ts';
import { firebaseService } from '../services/firebaseService.ts';
import { validateBookingStatusTransition } from '../utils/bookingStatusFlow.ts';
import { notificationService } from '../services/notificationService.ts';

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { vehicleId, serviceType, preferredDate, serviceCenterId } = req.body;
    const customerId = req.user!.userId;

    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', vehicleId);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found.' });
      return;
    }

    // Ensure customer owns the vehicle
    if (vehicle.ownerId !== customerId) {
      res.status(403).json({ message: 'Forbidden: You can only book service for vehicles you own.' });
      return;
    }

    const now = new Date().toISOString();
    const prefDate = preferredDate ? new Date(preferredDate).toISOString() : now;
    const bookingId = `BK_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const booking = await firebaseService.createDocument<Booking>(
      'bookings',
      {
        vehicleId,
        customerId,
        mechanicId: null,
        assignedMechanicId: null,
        assignedMechanicName: null,
        serviceCenterId: serviceCenterId || null,
        serviceType: serviceType || 'GENERAL_SERVICE',
        preferredDate: prefDate,
        status: 'PENDING',
        progressPercentage: 0
      },
      bookingId
    );

    const serviceCenter = serviceCenterId ? await firebaseService.getDocument<ServiceCenter>('serviceCenters', serviceCenterId) : null;

    // Broadcast real-time notification to all Administrators
    try {
      const vehicleLabel = `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})`;
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
  } catch (error: any) {
    console.error('createBooking error:', error);
    res.status(500).json({ message: 'Server error creating booking', error: error.message });
  }
};

export const getBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.user!;
    const { status, page = '1', limit = '10' } = req.query;

    let allBookings: Booking[] = [];

    if (role === 'CUSTOMER') {
      allBookings = await firebaseService.getBookingsByCustomer(userId);
    } else if (role === 'MECHANIC') {
      allBookings = await firebaseService.getBookingsByMechanic(userId);
    } else {
      allBookings = await firebaseService.getCollection<Booking>('bookings');
    }

    if (status && typeof status === 'string') {
      allBookings = allBookings.filter((b) => b.status === status.toUpperCase());
    }

    allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const total = allBookings.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = allBookings.slice(startIndex, startIndex + limitNum);

    const enrichedBookings = await Promise.all(
      paginated.map(async (b) => {
        const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', b.vehicleId);
        const customer = await firebaseService.getDocument<User>('users', b.customerId);
        const mechanic = b.mechanicId ? await firebaseService.getDocument<User>('users', b.mechanicId) : null;
        const serviceCenter = b.serviceCenterId ? await firebaseService.getDocument<ServiceCenter>('serviceCenters', b.serviceCenterId) : null;
        return {
          ...b,
          vehicle,
          customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null,
          mechanic: mechanic ? { id: mechanic.id, name: mechanic.name, email: mechanic.email } : null,
          serviceCenter
        };
      })
    );

    res.status(200).json({
      bookings: enrichedBookings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('getBookings error:', error);
    res.status(500).json({ message: 'Server error fetching bookings', error: error.message });
  }
};

export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const booking = await firebaseService.getDocument<Booking>('bookings', id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    if (role === 'CUSTOMER' && booking.customerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You do not have access to this booking.' });
      return;
    }

    if (role === 'MECHANIC' && booking.mechanicId !== userId && booking.status !== 'APPROVED') {
      res.status(403).json({ message: 'Forbidden: You do not have access to this booking.' });
      return;
    }

    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', booking.vehicleId);
    const customer = await firebaseService.getDocument<User>('users', booking.customerId);
    const mechanic = booking.mechanicId ? await firebaseService.getDocument<User>('users', booking.mechanicId) : null;
    const rawLogs = await firebaseService.getCollection<RepairLog>('repairLogs', [{ field: 'bookingId', op: '==', value: booking.id }]);
    
    const repairLogs = await Promise.all(
      rawLogs.map(async (rl) => {
        const updater = await firebaseService.getDocument<User>('users', rl.updatedBy);
        return {
          ...rl,
          updatedByUser: updater ? { id: updater.id, name: updater.name, role: updater.role } : null
        };
      })
    );

    const invoice = await firebaseService.getInvoiceByBooking(booking.id);
    const feedbackList = await firebaseService.getCollection('feedback', [{ field: 'bookingId', op: '==', value: booking.id }]);
    const feedback = feedbackList.length > 0 ? feedbackList[0] : null;

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
  } catch (error: any) {
    console.error('getBookingById error:', error);
    res.status(500).json({ message: 'Server error fetching booking details', error: error.message });
  }
};

export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ message: 'Target status is required.' });
      return;
    }

    const targetStatus = (status as string).toUpperCase() as BookingStatus;
    const booking = await firebaseService.getDocument<Booking>('bookings', id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    const validation = validateBookingStatusTransition(booking.status, targetStatus);
    if (!validation.valid) {
      res.status(400).json({ message: validation.reason });
      return;
    }

    const updated = await firebaseService.updateDocument<Booking>('bookings', id, { status: targetStatus });

    try {
      const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', booking.vehicleId);
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
  } catch (error: any) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ message: 'Server error updating booking status', error: error.message });
  }
};

export const assignMechanic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const mechanicId = req.body.mechanicId || req.body.assignedMechanicId;

    if (!mechanicId) {
      res.status(400).json({ message: 'mechanicId or assignedMechanicId is required.' });
      return;
    }

    const booking = await firebaseService.getDocument<Booking>('bookings', id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    const mechanic = await firebaseService.getUserById(mechanicId);
    if (!mechanic || mechanic.role !== 'MECHANIC') {
      res.status(400).json({ message: 'Invalid mechanicId. User must exist and have MECHANIC role.' });
      return;
    }

    let nextStatus: BookingStatus = booking.status;
    if (booking.status === 'APPROVED' || booking.status === 'PENDING') {
      nextStatus = 'ASSIGNED';
    }

    const updated = await firebaseService.updateDocument<Booking>('bookings', id, {
      mechanicId: mechanic.id,
      assignedMechanicId: mechanic.id,
      assignedMechanicName: mechanic.name,
      status: nextStatus
    });

    try {
      const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', booking.vehicleId);
      const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : `Vehicle`;

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
  } catch (error: any) {
    console.error('assignMechanic error:', error);
    res.status(500).json({ message: 'Server error assigning mechanic', error: error.message });
  }
};

export const addRepairLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const { userId, role } = req.user!;

    if (!note || note.trim() === '') {
      res.status(400).json({ message: 'Repair log note is required.' });
      return;
    }

    const booking = await firebaseService.getDocument<Booking>('bookings', id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    if (role === 'MECHANIC' && booking.mechanicId !== userId) {
      res.status(403).json({ message: 'Forbidden: You can only add repair logs to bookings assigned to you.' });
      return;
    }

    const logId = `rl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const log = await firebaseService.createDocument<RepairLog>(
      'repairLogs',
      {
        bookingId: id,
        note: note.trim(),
        updatedBy: userId
      },
      logId
    );

    res.status(201).json({ message: 'Repair log added successfully', repairLog: log });
  } catch (error: any) {
    console.error('addRepairLog error:', error);
    res.status(500).json({ message: 'Server error adding repair log', error: error.message });
  }
};

export const getRepairLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const booking = await firebaseService.getDocument<Booking>('bookings', id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    if (role === 'CUSTOMER' && booking.customerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You do not have access to repair logs for this booking.' });
      return;
    }

    if (role === 'MECHANIC' && booking.mechanicId !== userId) {
      res.status(403).json({ message: 'Forbidden: You do not have access to repair logs for this booking.' });
      return;
    }

    const rawLogs = await firebaseService.getCollection<RepairLog>('repairLogs', [{ field: 'bookingId', op: '==', value: id }]);
    const repairLogs = await Promise.all(
      rawLogs.map(async (rl) => {
        const user = await firebaseService.getDocument<User>('users', rl.updatedBy);
        return {
          ...rl,
          updatedByUser: user ? { id: user.id, name: user.name, role: user.role } : null
        };
      })
    );

    res.status(200).json({ repairLogs });
  } catch (error: any) {
    console.error('getRepairLogs error:', error);
    res.status(500).json({ message: 'Server error fetching repair logs', error: error.message });
  }
};

export const getAdminBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, mechanicId, startDate, endDate, page = '1', limit = '10' } = req.query;

    let allBookings = await firebaseService.getCollection<Booking>('bookings');

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

    const enriched = await Promise.all(
      paginated.map(async (b) => ({
        ...b,
        vehicle: await firebaseService.getDocument<Vehicle>('vehicles', b.vehicleId),
        customer: await firebaseService.getDocument<User>('users', b.customerId),
        mechanic: b.mechanicId ? await firebaseService.getDocument<User>('users', b.mechanicId) : null
      }))
    );

    res.status(200).json({
      bookings: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('getAdminBookings error:', error);
    res.status(500).json({ message: 'Server error fetching admin bookings', error: error.message });
  }
};

export const deleteAllBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.user!;
    if (role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: Only administrators can delete all bookings.' });
      return;
    }

    const bookings = await firebaseService.getCollection<Booking>('bookings');
    for (const b of bookings) {
      await firebaseService.deleteDocument('bookings', b.id);
    }
    res.status(200).json({ message: 'All bookings deleted successfully.' });
  } catch (error: any) {
    console.error('deleteAllBookings error:', error);
    res.status(500).json({ message: 'Server error deleting all bookings', error: error.message });
  }
};

export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const booking = await firebaseService.getDocument<Booking>('bookings', id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    if (role !== 'ADMIN' && booking.customerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You do not have permission to delete this booking.' });
      return;
    }

    await firebaseService.deleteDocument('bookings', id);
    res.status(200).json({ message: `Booking '${id}' deleted successfully.` });
  } catch (error: any) {
    console.error('deleteBooking error:', error);
    res.status(500).json({ message: 'Server error deleting booking', error: error.message });
  }
};
