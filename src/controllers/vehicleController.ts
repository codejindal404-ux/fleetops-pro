import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Vehicle, VehicleFleetStats } from '../types.ts';
import { firebaseService } from '../services/firebaseService.ts';
import { serviceReminderService } from '../services/serviceReminderService.ts';
import { GLOBAL_VEHICLE_DATABASE, VEHICLE_CATEGORIES, VehicleCompanyRecord } from '../data/vehicleDatabase.ts';

/**
 * Calculate initial or dynamic health score for a vehicle
 */
export function calculateVehicleHealthScore(vehicle: Partial<Vehicle>): number {
  let score = 100;
  const currentYear = new Date().getFullYear();
  const year = vehicle.manufacturingYear || vehicle.year || currentYear;
  const age = Math.max(0, currentYear - year);
  
  // Age impact: -2 points per year of age
  score -= Math.min(25, age * 2);

  // Mileage impact
  const mileage = vehicle.mileage || 0;
  if (mileage > 150000) score -= 25;
  else if (mileage > 100000) score -= 18;
  else if (mileage > 60000) score -= 12;
  else if (mileage > 30000) score -= 6;

  // Reminder status impact
  if (vehicle.reminderStatus === 'OVERDUE') score -= 15;
  else if (vehicle.reminderStatus === 'DUE_SOON') score -= 5;

  return Math.max(35, Math.min(100, Math.round(score)));
}

export const addVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      registrationNumber,
      company,
      brand,
      model,
      variant,
      year,
      manufacturingYear,
      vehicleType,
      category,
      fuelType,
      transmission,
      engineNumber,
      chassisNumber,
      color,
      mileage,
      batteryCapacity,
      range,
      vehicleImage,
      serviceIntervalMonths,
      serviceIntervalMileage,
      avgMonthlyMileage,
      serviceReminderNotes
    } = req.body;
    const ownerId = req.user!.userId;

    const resolvedCompany = (company || brand || '').trim();
    if (!resolvedCompany) {
      res.status(400).json({ message: 'Vehicle manufacturer company cannot be empty.' });
      return;
    }

    const resolvedModel = (model || '').trim();
    if (!resolvedModel) {
      res.status(400).json({ message: 'Vehicle model cannot be empty.' });
      return;
    }

    const resolvedType = (vehicleType || category || 'Car').trim();
    if (!resolvedType) {
      res.status(400).json({ message: 'Vehicle type/category must be selected.' });
      return;
    }

    const effectiveYear = Number(manufacturingYear || year || new Date().getFullYear());
    const currentYear = new Date().getFullYear();
    if (effectiveYear < 1900 || effectiveYear > currentYear + 1) {
      res.status(400).json({ message: `Year must be a valid 4-digit year between 1900 and ${currentYear + 1}.` });
      return;
    }

    const upperReg = registrationNumber.trim().toUpperCase();
    const existingReg = await firebaseService.getVehicleByReg(upperReg);
    if (existingReg) {
      res.status(400).json({ message: 'A vehicle with this registration number already exists.' });
      return;
    }

    // Check unique engine number if provided
    if (engineNumber && engineNumber.trim()) {
      const upperEngine = engineNumber.trim().toUpperCase();
      const existingEngine = await firebaseService.getVehicleByEngineNumber(upperEngine);
      if (existingEngine) {
        res.status(400).json({ message: 'A vehicle with this Engine Number already exists in the system.' });
        return;
      }
    }

    // Check unique chassis number if provided
    if (chassisNumber && chassisNumber.trim()) {
      const upperChassis = chassisNumber.trim().toUpperCase();
      const existingChassis = await firebaseService.getVehicleByChassisNumber(upperChassis);
      if (existingChassis) {
        res.status(400).json({ message: 'A vehicle with this Chassis Number (VIN) already exists in the system.' });
        return;
      }
    }

    const defaultMileage = mileage !== undefined && mileage !== null ? Number(mileage) : 15000;
    const sIntervalMonths = serviceIntervalMonths ? Number(serviceIntervalMonths) : 6;
    const sIntervalMileage = serviceIntervalMileage ? Number(serviceIntervalMileage) : 5000;
    const aMonthlyMileage = avgMonthlyMileage ? Number(avgMonthlyMileage) : 1000;
    const lastServiceMileage = Math.max(0, defaultMileage - Math.floor(sIntervalMileage * 0.7));
    const nextMaintenanceMileage = lastServiceMileage + sIntervalMileage;

    const now = new Date();
    const defaultLastServiceDate = new Date(now.getTime() - (sIntervalMonths - 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultNextServiceDueDate = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const initialHealth = calculateVehicleHealthScore({
      manufacturingYear: effectiveYear,
      year: effectiveYear,
      mileage: defaultMileage,
      reminderStatus: 'DUE_SOON'
    });

    const vehicleId = `veh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newVehicleData: Vehicle = {
      id: vehicleId,
      vehicleId,
      ownerId,
      registrationNumber: upperReg,
      company: resolvedCompany,
      brand: resolvedCompany,
      model: resolvedModel,
      variant: variant?.trim() || 'Standard Spec',
      vehicleType: resolvedType,
      category: resolvedType,
      fuelType: fuelType || 'Petrol',
      transmission: transmission || 'Automatic',
      manufacturingYear: effectiveYear,
      year: effectiveYear,
      engineNumber: engineNumber ? engineNumber.trim().toUpperCase() : undefined,
      chassisNumber: chassisNumber ? chassisNumber.trim().toUpperCase() : undefined,
      color: color?.trim() || 'Metallic Pearl White',
      mileage: defaultMileage,
      batteryCapacity: batteryCapacity ? Number(batteryCapacity) : undefined,
      range: range ? Number(range) : undefined,
      vehicleImage: vehicleImage || undefined,
      healthScore: initialHealth,
      serviceHistory: [
        {
          id: `hist_${Date.now()}`,
          date: defaultLastServiceDate,
          type: 'Initial Pre-Delivery Inspection & Registration',
          mileage: lastServiceMileage,
          notes: 'Standard manufacturer compliance and diagnostic health verified.',
          mechanicName: 'Certified Fleet Inspector'
        }
      ],
      lastServiceMileage,
      nextMaintenanceMileage,
      serviceIntervalMonths: sIntervalMonths,
      serviceIntervalMileage: sIntervalMileage,
      avgMonthlyMileage: aMonthlyMileage,
      lastServiceDate: defaultLastServiceDate,
      nextServiceDueDate: defaultNextServiceDueDate,
      recurringReminderEnabled: true,
      reminderStatus: 'DUE_SOON',
      serviceReminderNotes: serviceReminderNotes || 'Periodic Maintenance & Multi-Point Inspection',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    const vehicle = await firebaseService.createDocument<Vehicle>(
      'vehicles',
      newVehicleData,
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

    // Enrich with live reminder evaluation and health score
    const enriched = vehicles.map((v) => {
      const evaluation = serviceReminderService.evaluateVehicle(v);
      const computedHealth = v.healthScore ?? calculateVehicleHealthScore({ ...v, reminderStatus: evaluation.status });
      return {
        ...v,
        company: v.company || v.brand,
        brand: v.brand || v.company,
        manufacturingYear: v.manufacturingYear || v.year,
        year: v.year || v.manufacturingYear,
        healthScore: computedHealth,
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
    const computedHealth = vehicle.healthScore ?? calculateVehicleHealthScore({ ...vehicle, reminderStatus: reminderEvaluation.status });

    res.status(200).json({
      vehicle: {
        ...vehicle,
        company: vehicle.company || vehicle.brand,
        brand: vehicle.brand || vehicle.company,
        manufacturingYear: vehicle.manufacturingYear || vehicle.year,
        year: vehicle.year || vehicle.manufacturingYear,
        healthScore: computedHealth,
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
      company,
      brand,
      model,
      variant,
      year,
      manufacturingYear,
      vehicleType,
      category,
      fuelType,
      transmission,
      engineNumber,
      chassisNumber,
      color,
      mileage,
      batteryCapacity,
      range,
      vehicleImage,
      healthScore,
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

    // Validate registration number uniqueness
    if (registrationNumber && registrationNumber.toUpperCase() !== vehicle.registrationNumber.toUpperCase()) {
      const existingReg = await firebaseService.getVehicleByReg(registrationNumber.trim().toUpperCase());
      if (existingReg && existingReg.id !== id) {
        res.status(400).json({ message: 'A vehicle with this registration number already exists.' });
        return;
      }
    }

    // Validate engine number uniqueness
    if (engineNumber && engineNumber.trim() && engineNumber.trim().toUpperCase() !== (vehicle.engineNumber || '')) {
      const existingEngine = await firebaseService.getVehicleByEngineNumber(engineNumber.trim().toUpperCase());
      if (existingEngine && existingEngine.id !== id) {
        res.status(400).json({ message: 'A vehicle with this Engine Number already exists.' });
        return;
      }
    }

    // Validate chassis number uniqueness
    if (chassisNumber && chassisNumber.trim() && chassisNumber.trim().toUpperCase() !== (vehicle.chassisNumber || '')) {
      const existingChassis = await firebaseService.getVehicleByChassisNumber(chassisNumber.trim().toUpperCase());
      if (existingChassis && existingChassis.id !== id) {
        res.status(400).json({ message: 'A vehicle with this Chassis Number (VIN) already exists.' });
        return;
      }
    }

    const updates: Partial<Vehicle> = {};
    if (registrationNumber) updates.registrationNumber = registrationNumber.trim().toUpperCase();
    if (company || brand) {
      const val = (company || brand).trim();
      updates.company = val;
      updates.brand = val;
    }
    if (model) updates.model = model.trim();
    if (variant !== undefined) updates.variant = variant.trim();
    if (year || manufacturingYear) {
      const y = Number(year || manufacturingYear);
      updates.year = y;
      updates.manufacturingYear = y;
    }
    if (vehicleType || category) {
      const vt = (vehicleType || category).trim();
      updates.vehicleType = vt;
      updates.category = vt;
    }
    if (fuelType) updates.fuelType = fuelType;
    if (transmission) updates.transmission = transmission;
    if (engineNumber !== undefined) updates.engineNumber = engineNumber ? engineNumber.trim().toUpperCase() : undefined;
    if (chassisNumber !== undefined) updates.chassisNumber = chassisNumber ? chassisNumber.trim().toUpperCase() : undefined;
    if (color !== undefined) updates.color = color.trim();
    if (mileage !== undefined && mileage !== null) updates.mileage = Number(mileage);
    if (batteryCapacity !== undefined) updates.batteryCapacity = batteryCapacity ? Number(batteryCapacity) : undefined;
    if (range !== undefined) updates.range = range ? Number(range) : undefined;
    if (vehicleImage !== undefined) updates.vehicleImage = vehicleImage;
    if (healthScore !== undefined) updates.healthScore = Number(healthScore);
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
      vehicle: {
        ...updatedVehicle,
        company: updatedVehicle.company || updatedVehicle.brand,
        brand: updatedVehicle.brand || updatedVehicle.company,
        reminderStatus: evaluation.status
      },
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

/**
 * Global Vehicle Database Endpoints
 */

// GET /api/vehicles/catalog
export const getVehicleCatalog = async (req: Request, res: Response): Promise<void> => {
  try {
    // Merge built-in database with any custom companies stored by admins in Firestore
    const customCompanies = await firebaseService.getCollection<VehicleCompanyRecord>('customVehicleCatalog');
    const combined: VehicleCompanyRecord[] = [...GLOBAL_VEHICLE_DATABASE];

    customCompanies.forEach((custom) => {
      const idx = combined.findIndex((c) => c.company.toLowerCase() === custom.company.toLowerCase());
      if (idx >= 0) {
        // Merge vehicles
        const existing = combined[idx];
        const existingModels = new Set(existing.vehicles.map((v) => v.model.toLowerCase()));
        const newModels = custom.vehicles.filter((v) => !existingModels.has(v.model.toLowerCase()));
        combined[idx] = {
          ...existing,
          vehicles: [...existing.vehicles, ...newModels]
        };
      } else {
        combined.push(custom);
      }
    });

    combined.sort((a, b) => a.company.localeCompare(b.company));
    res.status(200).json({ catalog: combined });
  } catch (error: any) {
    console.error('getVehicleCatalog error:', error);
    res.status(500).json({ message: 'Server error fetching vehicle catalog', error: error.message });
  }
};

// GET /api/vehicles/catalog/categories
export const getVehicleCategoriesEndpoint = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ categories: VEHICLE_CATEGORIES });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching categories', error: error.message });
  }
};

// POST /api/vehicles/catalog/company (Admin only)
export const addCatalogCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.user!;
    if (role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: Administrator privileges required.' });
      return;
    }

    const { company, country, category, vehicles } = req.body;
    if (!company || !company.trim()) {
      res.status(400).json({ message: 'Company name is required.' });
      return;
    }

    const docId = `custom_co_${company.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const newCompany: VehicleCompanyRecord = {
      company: company.trim(),
      country: country?.trim() || 'Global',
      category: category?.trim() || 'Cars',
      vehicles: Array.isArray(vehicles) ? vehicles : []
    };

    await firebaseService.createDocument('customVehicleCatalog', newCompany, docId);
    res.status(201).json({ message: 'Vehicle manufacturer company added to catalog', company: newCompany });
  } catch (error: any) {
    console.error('addCatalogCompany error:', error);
    res.status(500).json({ message: 'Server error adding catalog company', error: error.message });
  }
};

// POST /api/vehicles/catalog/model (Admin only)
export const addCatalogModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.user!;
    if (role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: Administrator privileges required.' });
      return;
    }

    const { company, model, type, fuel, transmissions, defaultBatteryCapacity, defaultRange } = req.body;
    if (!company || !model) {
      res.status(400).json({ message: 'Company and Model name are required.' });
      return;
    }

    const docId = `custom_co_${company.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const existingDoc = await firebaseService.getDocument<VehicleCompanyRecord>('customVehicleCatalog', docId);

    const newModelSpec = {
      model: model.trim(),
      type: type || 'Cars',
      fuel: fuel || ['Petrol'],
      transmissions: transmissions || ['Automatic'],
      defaultBatteryCapacity: defaultBatteryCapacity ? Number(defaultBatteryCapacity) : undefined,
      defaultRange: defaultRange ? Number(defaultRange) : undefined
    };

    if (existingDoc) {
      const updatedVehicles = [...existingDoc.vehicles.filter((v) => v.model.toLowerCase() !== model.trim().toLowerCase()), newModelSpec];
      await firebaseService.updateDocument('customVehicleCatalog', docId, { vehicles: updatedVehicles });
    } else {
      // Find from base catalog
      const baseCompany = GLOBAL_VEHICLE_DATABASE.find((c) => c.company.toLowerCase() === company.trim().toLowerCase());
      const baseVehicles = baseCompany ? baseCompany.vehicles : [];
      await firebaseService.createDocument('customVehicleCatalog', {
        company: company.trim(),
        country: baseCompany?.country || 'Global',
        category: baseCompany?.category || 'Cars',
        vehicles: [...baseVehicles, newModelSpec]
      }, docId);
    }

    res.status(201).json({ message: `Model ${model} added under ${company} successfully.` });
  } catch (error: any) {
    console.error('addCatalogModel error:', error);
    res.status(500).json({ message: 'Server error adding model to catalog', error: error.message });
  }
};

// GET /api/vehicles/stats (Admin & Mechanic)
export const getVehicleStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await firebaseService.getCollection<Vehicle>('vehicles');

    const totalVehicles = vehicles.length;
    let totalEVs = 0;
    let totalHybrids = 0;
    let totalICE = 0;
    let totalHealthSum = 0;

    const byCategory: Record<string, number> = {};
    const byFuelType: Record<string, number> = {};
    const brandMap: Record<string, number> = {};

    const healthDist = {
      excellent: 0,
      good: 0,
      fair: 0,
      attention: 0
    };

    vehicles.forEach((v) => {
      const fuel = (v.fuelType || '').toLowerCase();
      const cat = v.category || v.vehicleType || 'Cars';
      const brand = v.company || v.brand || 'Other';
      const health = v.healthScore ?? calculateVehicleHealthScore(v);

      totalHealthSum += health;

      if (fuel.includes('electric') || cat.toLowerCase().includes('ev') || cat.toLowerCase().includes('electric')) {
        totalEVs++;
      } else if (fuel.includes('hybrid')) {
        totalHybrids++;
      } else {
        totalICE++;
      }

      byCategory[cat] = (byCategory[cat] || 0) + 1;
      const fuelKey = v.fuelType || 'Petrol';
      byFuelType[fuelKey] = (byFuelType[fuelKey] || 0) + 1;
      brandMap[brand] = (brandMap[brand] || 0) + 1;

      if (health >= 90) healthDist.excellent++;
      else if (health >= 75) healthDist.good++;
      else if (health >= 50) healthDist.fair++;
      else healthDist.attention++;
    });

    const byBrand = Object.entries(brandMap)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);

    const stats: VehicleFleetStats = {
      totalVehicles,
      totalEVs,
      totalHybrids,
      totalICE,
      averageHealthScore: totalVehicles > 0 ? Math.round(totalHealthSum / totalVehicles) : 100,
      byCategory,
      byFuelType,
      byBrand,
      healthScoreDistribution: healthDist
    };

    res.status(200).json({ stats });
  } catch (error: any) {
    console.error('getVehicleStats error:', error);
    res.status(500).json({ message: 'Server error calculating vehicle stats', error: error.message });
  }
};
