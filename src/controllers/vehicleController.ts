import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Vehicle } from '../types.ts';
import { firebaseService } from '../services/firebaseService.ts';
import { serviceReminderService } from '../services/serviceReminderService.ts';

export const addVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      registrationNumber,
      brand,
      model,
      year,
      vehicleType,
      mileage,
      serviceIntervalMonths,
      serviceIntervalMileage,
      avgMonthlyMileage,
      serviceReminderNotes
    } = req.body;
    const ownerId = req.user!.userId;

    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      res.status(400).json({ message: `Year must be a valid 4-digit year between 1900 and ${currentYear + 1}.` });
      return;
    }

    const upperReg = registrationNumber.trim().toUpperCase();
    const existingReg = await firebaseService.getVehicleByReg(upperReg);
    if (existingReg) {
      res.status(400).json({ message: 'A vehicle with this registration number already exists.' });
      return;
    }

    const defaultMileage = mileage !== undefined ? Number(mileage) : 25000;
    const sIntervalMonths = serviceIntervalMonths ? Number(serviceIntervalMonths) : 6;
    const sIntervalMileage = serviceIntervalMileage ? Number(serviceIntervalMileage) : 5000;
    const aMonthlyMileage = avgMonthlyMileage ? Number(avgMonthlyMileage) : 1000;
    const lastServiceMileage = Math.max(0, defaultMileage - Math.floor(sIntervalMileage * 0.7));
    const nextMaintenanceMileage = lastServiceMileage + sIntervalMileage;

    const now = new Date();
    const defaultLastServiceDate = new Date(now.getTime() - (sIntervalMonths - 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultNextServiceDueDate = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const vehicleId = `veh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const vehicle = await firebaseService.createDocument<Vehicle>(
      'vehicles',
      {
        ownerId,
        registrationNumber: upperReg,
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year),
        vehicleType: vehicleType || 'CAR',
        mileage: defaultMileage,
        lastServiceMileage,
        nextMaintenanceMileage,
        serviceIntervalMonths: sIntervalMonths,
        serviceIntervalMileage: sIntervalMileage,
        avgMonthlyMileage: aMonthlyMileage,
        lastServiceDate: defaultLastServiceDate,
        nextServiceDueDate: defaultNextServiceDueDate,
        recurringReminderEnabled: true,
        reminderStatus: 'DUE_SOON',
        serviceReminderNotes: serviceReminderNotes || 'Periodic Maintenance & Multi-Point Inspection'
      },
      vehicleId
    );

    // Evaluate initial reminder status
    serviceReminderService.evaluateVehicle(vehicle);

    res.status(201).json({ message: 'Vehicle added successfully', vehicle });
  } catch (error: any) {
    console.error('addVehicle error:', error);
    res.status(500).json({ message: 'Server error adding vehicle', error: error.message });
  }
};

export const getVehicles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.user!;

    let vehicles: Vehicle[];
    if (role === 'CUSTOMER') {
      vehicles = await firebaseService.getVehiclesByOwner(userId);
    } else {
      // ADMIN or MECHANIC sees all
      vehicles = await firebaseService.getCollection<Vehicle>('vehicles');
    }

    // Enrich with live reminder evaluation
    const enriched = vehicles.map((v) => {
      const evaluation = serviceReminderService.evaluateVehicle(v);
      return {
        ...v,
        reminderStatus: evaluation.status,
        reminderEvaluation: evaluation
      };
    });

    res.status(200).json({ vehicles: enriched });
  } catch (error: any) {
    console.error('getVehicles error:', error);
    res.status(500).json({ message: 'Server error fetching vehicles', error: error.message });
  }
};

export const getVehicleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', id);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found.' });
      return;
    }

    // Access check: owner or admin/mechanic
    if (role === 'CUSTOMER' && vehicle.ownerId !== userId) {
      res.status(403).json({ message: 'Forbidden: You do not own this vehicle.' });
      return;
    }

    const bookingHistory = await firebaseService.getCollection('bookings', [{ field: 'vehicleId', op: '==', value: id }]);
    const owner = await firebaseService.getUserById(vehicle.ownerId);
    const reminderEvaluation = serviceReminderService.evaluateVehicle(vehicle);

    res.status(200).json({
      vehicle: {
        ...vehicle,
        reminderStatus: reminderEvaluation.status
      },
      owner: owner ? { id: owner.id, name: owner.name, email: owner.email, phone: owner.phone } : null,
      bookingHistory,
      reminderEvaluation
    });
  } catch (error: any) {
    console.error('getVehicleById error:', error);
    res.status(500).json({ message: 'Server error fetching vehicle details', error: error.message });
  }
};

export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { userId, role } = req.user!;
    const {
      registrationNumber,
      brand,
      model,
      year,
      vehicleType,
      mileage,
      serviceIntervalMonths,
      serviceIntervalMileage,
      avgMonthlyMileage,
      lastServiceDate,
      nextServiceDueDate,
      recurringReminderEnabled,
      serviceReminderNotes
    } = req.body;

    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', id);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found.' });
      return;
    }

    // Permission check: Owner, Admin, or Mechanic
    if (vehicle.ownerId !== userId && role !== 'ADMIN' && role !== 'MECHANIC') {
      res.status(403).json({ message: 'Forbidden: You do not have permission to update vehicle details.' });
      return;
    }

    if (mileage !== undefined && mileage !== null) {
      const newMileage = Number(mileage);
      if (isNaN(newMileage) || newMileage < 0) {
        res.status(400).json({ message: 'Mileage must be a non-negative number.' });
        return;
      }
    }

    if (registrationNumber && registrationNumber.toUpperCase() !== vehicle.registrationNumber.toUpperCase()) {
      const existingReg = await firebaseService.getVehicleByReg(registrationNumber.trim().toUpperCase());
      if (existingReg && existingReg.id !== id) {
        res.status(400).json({ message: 'A vehicle with this registration number already exists.' });
        return;
      }
    }

    const updates: Partial<Vehicle> = {};
    if (registrationNumber) updates.registrationNumber = registrationNumber.trim().toUpperCase();
    if (brand) updates.brand = brand.trim();
    if (model) updates.model = model.trim();
    if (year) updates.year = Number(year);
    if (vehicleType) updates.vehicleType = vehicleType;
    if (mileage !== undefined && mileage !== null) updates.mileage = Number(mileage);
    if (serviceIntervalMonths !== undefined) updates.serviceIntervalMonths = Number(serviceIntervalMonths);
    if (serviceIntervalMileage !== undefined) updates.serviceIntervalMileage = Number(serviceIntervalMileage);
    if (avgMonthlyMileage !== undefined) updates.avgMonthlyMileage = Number(avgMonthlyMileage);
    if (lastServiceDate) updates.lastServiceDate = lastServiceDate;
    if (nextServiceDueDate) updates.nextServiceDueDate = nextServiceDueDate;
    if (recurringReminderEnabled !== undefined) updates.recurringReminderEnabled = Boolean(recurringReminderEnabled);
    if (serviceReminderNotes !== undefined) updates.serviceReminderNotes = serviceReminderNotes;

    const updatedVehicle = await firebaseService.updateDocument<Vehicle>('vehicles', id, updates);
    if (!updatedVehicle) {
      res.status(500).json({ message: 'Failed to update vehicle.' });
      return;
    }

    const evaluation = serviceReminderService.evaluateVehicle(updatedVehicle);
    res.status(200).json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle,
      reminderEvaluation: evaluation
    });
  } catch (error: any) {
    console.error('updateVehicle error:', error);
    res.status(500).json({ message: 'Server error updating vehicle', error: error.message });
  }
};

export const updateVehicleMileageOnly = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { mileage } = req.body;
    const { userId, role } = req.user!;

    if (mileage === undefined || isNaN(Number(mileage)) || Number(mileage) < 0) {
      res.status(400).json({ message: 'A valid non-negative mileage number is required.' });
      return;
    }

    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', id);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found.' });
      return;
    }

    if (vehicle.ownerId !== userId && role !== 'ADMIN' && role !== 'MECHANIC') {
      res.status(403).json({ message: 'Forbidden: You cannot update mileage for this vehicle.' });
      return;
    }

    const updated = await firebaseService.updateDocument<Vehicle>('vehicles', id, { mileage: Number(mileage) });
    if (!updated) {
      res.status(500).json({ message: 'Failed to update vehicle mileage.' });
      return;
    }

    // Trigger evaluation with notification dispatch if the new mileage breached a maintenance threshold
    const evaluation = await serviceReminderService.evaluateAndNotify(updated);

    res.status(200).json({
      message: `Odometer updated to ${Number(mileage).toLocaleString()} miles`,
      vehicle: updated,
      reminderEvaluation: evaluation
    });
  } catch (error: any) {
    console.error('updateVehicleMileageOnly error:', error);
    res.status(500).json({ message: 'Server error updating mileage', error: error.message });
  }
};

export const updateReminderConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;
    const {
      serviceIntervalMonths,
      serviceIntervalMileage,
      avgMonthlyMileage,
      recurringReminderEnabled,
      lastServiceDate,
      lastServiceMileage,
      serviceReminderNotes
    } = req.body;

    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', id);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found.' });
      return;
    }

    if (vehicle.ownerId !== userId && role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: You do not own this vehicle.' });
      return;
    }

    const months = serviceIntervalMonths ? Number(serviceIntervalMonths) : (vehicle.serviceIntervalMonths || 6);
    const miles = serviceIntervalMileage ? Number(serviceIntervalMileage) : (vehicle.serviceIntervalMileage || 5000);
    const avgMonthly = avgMonthlyMileage ? Number(avgMonthlyMileage) : (vehicle.avgMonthlyMileage || 1000);

    let nextDueDate = vehicle.nextServiceDueDate;
    if (lastServiceDate) {
      nextDueDate = new Date(new Date(lastServiceDate).getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    let nextMaintenanceMileage = vehicle.nextMaintenanceMileage;
    if (lastServiceMileage !== undefined) {
      nextMaintenanceMileage = Number(lastServiceMileage) + miles;
    }

    const updated = await firebaseService.updateDocument<Vehicle>('vehicles', id, {
      serviceIntervalMonths: months,
      serviceIntervalMileage: miles,
      avgMonthlyMileage: avgMonthly,
      recurringReminderEnabled: recurringReminderEnabled !== undefined ? Boolean(recurringReminderEnabled) : true,
      ...(lastServiceDate && { lastServiceDate }),
      ...(lastServiceMileage !== undefined && { lastServiceMileage: Number(lastServiceMileage) }),
      ...(nextDueDate && { nextServiceDueDate: nextDueDate }),
      ...(nextMaintenanceMileage && { nextMaintenanceMileage }),
      ...(serviceReminderNotes !== undefined && { serviceReminderNotes })
    });

    if (!updated) {
      res.status(500).json({ message: 'Failed to update reminder settings.' });
      return;
    }

    const evaluation = serviceReminderService.evaluateVehicle(updated);

    res.status(200).json({
      message: 'Service reminder settings updated successfully',
      vehicle: updated,
      reminderEvaluation: evaluation
    });
  } catch (error: any) {
    console.error('updateReminderConfig error:', error);
    res.status(500).json({ message: 'Server error updating reminder settings', error: error.message });
  }
};

export const getVehicleReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', id);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found.' });
      return;
    }

    if (vehicle.ownerId !== userId && role !== 'ADMIN' && role !== 'MECHANIC') {
      res.status(403).json({ message: 'Forbidden: Access denied.' });
      return;
    }

    const evaluation = serviceReminderService.evaluateVehicle(vehicle);

    res.status(200).json({
      vehicle,
      reminder: evaluation
    });
  } catch (error: any) {
    console.error('getVehicleReminders error:', error);
    res.status(500).json({ message: 'Server error fetching vehicle reminders', error: error.message });
  }
};

export const evaluateAndTriggerReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;
    const { force } = req.body;

    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', id);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found.' });
      return;
    }

    if (vehicle.ownerId !== userId && role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: Access denied.' });
      return;
    }

    const result = await serviceReminderService.evaluateAndNotify(vehicle, { force: force ?? true });

    res.status(200).json({
      message: result.notificationSent
        ? `Real-time service reminder triggered for ${vehicle.brand} ${vehicle.model} (${result.reason})`
        : `Vehicle evaluated: ${result.status} (${result.daysRemaining} days / ${result.milesRemaining.toLocaleString()} mi remaining)`,
      result
    });
  } catch (error: any) {
    console.error('evaluateAndTriggerReminder error:', error);
    res.status(500).json({ message: 'Server error triggering reminder', error: error.message });
  }
};

export const checkAllRemindersAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.user!;
    if (role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: Administrator privileges required.' });
      return;
    }

    const result = await serviceReminderService.checkAllVehicles({ force: req.body?.force ?? false });

    res.status(200).json({
      message: `Evaluated ${result.totalVehicles} vehicles across fleet. Dispatched ${result.notificationsSent} reminders.`,
      result
    });
  } catch (error: any) {
    console.error('checkAllRemindersAdmin error:', error);
    res.status(500).json({ message: 'Server error checking reminders', error: error.message });
  }
};

export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user!;

    const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', id);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found.' });
      return;
    }

    if (vehicle.ownerId !== userId && role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: Only the owner or an admin can delete this vehicle.' });
      return;
    }

    await firebaseService.deleteDocument('vehicles', id);
    res.status(200).json({ message: 'Vehicle deleted successfully.' });
  } catch (error: any) {
    console.error('deleteVehicle error:', error);
    res.status(500).json({ message: 'Server error deleting vehicle', error: error.message });
  }
};
