import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { dbStore } from '../services/dbStore.ts';
import { serviceReminderService } from '../services/serviceReminderService.ts';

export const addVehicle = async (req: Request, res: Response): Promise<void> => {
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

  const existingReg = dbStore.getVehicleByRegNumber(registrationNumber);
  if (existingReg) {
    res.status(400).json({ message: 'A vehicle with this registration number already exists.' });
    return;
  }

  const vehicle = dbStore.createVehicle({
    ownerId,
    registrationNumber,
    brand,
    model,
    year: Number(year),
    vehicleType: vehicleType || 'CAR',
    mileage: mileage !== undefined ? Number(mileage) : undefined,
    serviceIntervalMonths: serviceIntervalMonths ? Number(serviceIntervalMonths) : 6,
    serviceIntervalMileage: serviceIntervalMileage ? Number(serviceIntervalMileage) : 5000,
    avgMonthlyMileage: avgMonthlyMileage ? Number(avgMonthlyMileage) : 1000,
    serviceReminderNotes: serviceReminderNotes || 'Periodic Maintenance & Multi-Point Inspection'
  });

  // Evaluate initial reminder status
  serviceReminderService.evaluateVehicle(vehicle);

  res.status(201).json({ message: 'Vehicle added successfully', vehicle });
};

export const getVehicles = async (req: Request, res: Response): Promise<void> => {
  const { userId, role } = req.user!;

  let vehicles;
  if (role === 'CUSTOMER') {
    vehicles = dbStore.getVehiclesByOwner(userId);
  } else {
    // ADMIN or MECHANIC sees all
    vehicles = dbStore.getVehicles();
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
};

export const getVehicleById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  const vehicle = dbStore.getVehicleById(id);
  if (!vehicle) {
    res.status(404).json({ message: 'Vehicle not found.' });
    return;
  }

  // Access check: owner or admin/mechanic
  if (role === 'CUSTOMER' && vehicle.ownerId !== userId) {
    res.status(403).json({ message: 'Forbidden: You do not own this vehicle.' });
    return;
  }

  const bookingHistory = dbStore.getBookingsByVehicle(id);
  const owner = dbStore.getUserById(vehicle.ownerId);
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
};

export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
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

  const vehicle = dbStore.getVehicleById(id);
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
    const existingReg = dbStore.getVehicleByRegNumber(registrationNumber);
    if (existingReg) {
      res.status(400).json({ message: 'A vehicle with this registration number already exists.' });
      return;
    }
  }

  if (year) {
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      res.status(400).json({ message: `Year must be a valid 4-digit year between 1900 and ${currentYear + 1}.` });
      return;
    }
  }

  const updatedVehicle = dbStore.updateVehicle(id, {
    ...(registrationNumber && { registrationNumber }),
    ...(brand && { brand }),
    ...(model && { model }),
    ...(year && { year: Number(year) }),
    ...(vehicleType && { vehicleType }),
    ...(mileage !== undefined && mileage !== null && { mileage: Number(mileage) }),
    ...(serviceIntervalMonths !== undefined && { serviceIntervalMonths: Number(serviceIntervalMonths) }),
    ...(serviceIntervalMileage !== undefined && { serviceIntervalMileage: Number(serviceIntervalMileage) }),
    ...(avgMonthlyMileage !== undefined && { avgMonthlyMileage: Number(avgMonthlyMileage) }),
    ...(lastServiceDate && { lastServiceDate }),
    ...(nextServiceDueDate && { nextServiceDueDate }),
    ...(recurringReminderEnabled !== undefined && { recurringReminderEnabled: Boolean(recurringReminderEnabled) }),
    ...(serviceReminderNotes !== undefined && { serviceReminderNotes })
  });

  // Re-evaluate reminder
  if (updatedVehicle) {
    const evaluation = serviceReminderService.evaluateVehicle(updatedVehicle);
    res.status(200).json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle,
      reminderEvaluation: evaluation
    });
    return;
  }

  res.status(200).json({ message: 'Vehicle updated successfully', vehicle: updatedVehicle });
};

export const updateVehicleMileageOnly = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { mileage } = req.body;
  const { userId, role } = req.user!;

  if (mileage === undefined || isNaN(Number(mileage)) || Number(mileage) < 0) {
    res.status(400).json({ message: 'A valid non-negative mileage number is required.' });
    return;
  }

  const vehicle = dbStore.getVehicleById(id);
  if (!vehicle) {
    res.status(404).json({ message: 'Vehicle not found.' });
    return;
  }

  if (vehicle.ownerId !== userId && role !== 'ADMIN' && role !== 'MECHANIC') {
    res.status(403).json({ message: 'Forbidden: You cannot update mileage for this vehicle.' });
    return;
  }

  const updated = dbStore.updateVehicleMileage(id, Number(mileage));
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
};

export const updateReminderConfig = async (req: Request, res: Response): Promise<void> => {
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

  const vehicle = dbStore.getVehicleById(id);
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

  // Recalculate next dueDate & nextMaintenanceMileage
  let nextDueDate = vehicle.nextServiceDueDate;
  if (lastServiceDate) {
    nextDueDate = new Date(new Date(lastServiceDate).getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  let nextMaintenanceMileage = vehicle.nextMaintenanceMileage;
  if (lastServiceMileage !== undefined) {
    nextMaintenanceMileage = Number(lastServiceMileage) + miles;
  }

  const updated = dbStore.updateVehicle(id, {
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
};

export const getVehicleReminders = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  const vehicle = dbStore.getVehicleById(id);
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
};

export const evaluateAndTriggerReminder = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;
  const { force } = req.body;

  const vehicle = dbStore.getVehicleById(id);
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
};

export const checkAllRemindersAdmin = async (req: Request, res: Response): Promise<void> => {
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
};

export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  const vehicle = dbStore.getVehicleById(id);
  if (!vehicle) {
    res.status(404).json({ message: 'Vehicle not found.' });
    return;
  }

  // Owner or Admin only
  if (vehicle.ownerId !== userId && role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden: Only the owner or an admin can delete this vehicle.' });
    return;
  }

  dbStore.deleteVehicle(id);
  res.status(200).json({ message: 'Vehicle deleted successfully.' });
};

