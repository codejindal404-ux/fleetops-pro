import { dbStore, VehicleRecord, UserRecord } from './dbStore.ts';
import { notificationService } from './notificationService.ts';
import { ServiceReminderEvaluation } from '../types.ts';

class ServiceReminderService {
  private timer: NodeJS.Timeout | null = null;

  /**
   * Evaluate maintenance status for a vehicle and calculate time / mileage metrics
   */
  public evaluateVehicle(vehicle: VehicleRecord, options: { force?: boolean } = {}): ServiceReminderEvaluation {
    const now = new Date();
    const serviceIntervalMonths = vehicle.serviceIntervalMonths || 6;
    const serviceIntervalMileage = vehicle.serviceIntervalMileage || 5000;
    const avgMonthlyMileage = vehicle.avgMonthlyMileage || 1000;
    const currentMileage = vehicle.mileage || 0;

    // Resolve or calculate Next Service Due Date
    let nextDueDate: Date;
    if (vehicle.nextServiceDueDate) {
      nextDueDate = new Date(vehicle.nextServiceDueDate);
      if (isNaN(nextDueDate.getTime())) {
        nextDueDate = new Date(now.getTime() + serviceIntervalMonths * 30 * 24 * 60 * 60 * 1000);
      }
    } else if (vehicle.lastServiceDate) {
      const lastDate = new Date(vehicle.lastServiceDate);
      nextDueDate = new Date(lastDate.getTime() + serviceIntervalMonths * 30 * 24 * 60 * 60 * 1000);
    } else {
      nextDueDate = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000);
    }

    const nextDueDateStr = nextDueDate.toISOString().split('T')[0];
    const diffMs = nextDueDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Resolve or calculate Next Service Due Mileage
    const lastServiceMileage = vehicle.lastServiceMileage ?? Math.max(0, currentMileage - Math.floor(serviceIntervalMileage * 0.7));
    const nextMaintenanceMileage = vehicle.nextMaintenanceMileage || (lastServiceMileage + serviceIntervalMileage);
    const milesRemaining = nextMaintenanceMileage - currentMileage;

    // Estimate days to reach mileage threshold based on average monthly driving
    const milesPerDay = Math.max(1, avgMonthlyMileage / 30);
    const projectedDaysToMileage = Math.round(milesRemaining / milesPerDay);

    const recommendedService = vehicle.serviceReminderNotes || `${serviceIntervalMileage.toLocaleString()}-Mile / ${serviceIntervalMonths}-Month Scheduled Maintenance`;

    let isDue = false;
    let status: 'OK' | 'DUE_SOON' | 'OVERDUE' = 'OK';
    let reason: 'TIME_30_DAYS' | 'MILEAGE_THRESHOLD' | 'OVERDUE' | 'NONE' = 'NONE';
    let title = 'Vehicle Maintenance Reminder';
    let message = '';

    // Condition 1: Overdue by time or mileage
    if (daysRemaining < 0 || milesRemaining < 0) {
      isDue = true;
      status = 'OVERDUE';
      reason = 'OVERDUE';
      title = `Service Overdue: ${vehicle.brand} ${vehicle.model}`;
      const overDays = Math.abs(daysRemaining);
      const overMiles = Math.abs(milesRemaining);
      if (daysRemaining < 0 && milesRemaining < 0) {
        message = `Your ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) is overdue for maintenance by ${overDays} day${overDays !== 1 ? 's' : ''} and ${overMiles.toLocaleString()} miles. Please schedule your service immediately to maintain warranty and performance.`;
      } else if (daysRemaining < 0) {
        message = `Your ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) is overdue for scheduled maintenance by ${overDays} day${overDays !== 1 ? 's' : ''}. Book a service center slot today.`;
      } else {
        message = `Your ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) exceeded its maintenance interval by ${overMiles.toLocaleString()} miles (Current: ${currentMileage.toLocaleString()} mi). Book your service now.`;
      }
    }
    // Condition 2: 30-day time window
    else if (daysRemaining <= 30) {
      isDue = true;
      status = 'DUE_SOON';
      reason = 'TIME_30_DAYS';
      title = `30-Day Service Reminder: ${vehicle.brand} ${vehicle.model}`;
      message = `Upcoming Scheduled Maintenance: Your ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) is due for service in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} on ${nextDueDateStr} (Current odometer: ${currentMileage.toLocaleString()} mi). Reserve a maintenance bay in advance.`;
    }
    // Condition 3: Mileage milestone window (within 500 miles or projected to hit milestone within 30 days)
    else if (milesRemaining <= 500 || projectedDaysToMileage <= 30) {
      isDue = true;
      status = 'DUE_SOON';
      reason = 'MILEAGE_THRESHOLD';
      title = `Mileage Service Alert: ${vehicle.brand} ${vehicle.model}`;
      message = `Mileage Maintenance Alert: Your ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) is at ${currentMileage.toLocaleString()} mi—only ${milesRemaining.toLocaleString()} mi away from its ${nextMaintenanceMileage.toLocaleString()} mi service milestone (~${projectedDaysToMileage} days at current driving pace).`;
    }

    return {
      vehicleId: vehicle.id,
      isDue,
      status,
      reason,
      daysRemaining,
      milesRemaining,
      projectedDaysToMileage,
      nextServiceDueDate: nextDueDateStr,
      nextMaintenanceMileage,
      currentMileage,
      lastServiceDate: vehicle.lastServiceDate,
      lastServiceMileage,
      recommendedService,
      title,
      message
    };
  }

  /**
   * Evaluates a vehicle and dispatches in-app and real-time Socket.IO notification if due
   */
  public async evaluateAndNotify(vehicle: VehicleRecord, options: { force?: boolean } = {}): Promise<ServiceReminderEvaluation> {
    const evaluation = this.evaluateVehicle(vehicle, options);

    // Update vehicle's persistent reminder status
    dbStore.updateVehicle(vehicle.id, {
      reminderStatus: evaluation.status,
      nextServiceDueDate: evaluation.nextServiceDueDate,
      nextMaintenanceMileage: evaluation.nextMaintenanceMileage
    });

    if (!evaluation.isDue) {
      return { ...evaluation, notificationSent: false };
    }

    if (vehicle.recurringReminderEnabled === false && !options.force) {
      return { ...evaluation, notificationSent: false };
    }

    // Rate-limiting: prevent sending identical reminder within 7 days unless forced
    if (vehicle.lastReminderSentAt && !options.force) {
      const lastSent = new Date(vehicle.lastReminderSentAt).getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - lastSent < sevenDaysMs) {
        return { ...evaluation, notificationSent: false };
      }
    }

    // Dispatch real-time notification
    try {
      const notifType = evaluation.reason === 'OVERDUE' ? 'MAINTENANCE_DUE' : 'SERVICE_REMINDER';
      await notificationService.createNotification({
        userId: vehicle.ownerId,
        title: evaluation.title,
        message: evaluation.message,
        type: notifType,
        link: '/customer',
        data: {
          vehicleId: vehicle.id,
          registrationNumber: vehicle.registrationNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          daysRemaining: evaluation.daysRemaining,
          milesRemaining: evaluation.milesRemaining,
          nextServiceDueDate: evaluation.nextServiceDueDate,
          nextMaintenanceMileage: evaluation.nextMaintenanceMileage,
          recommendedService: evaluation.recommendedService,
          reason: evaluation.reason
        }
      });

      // Update lastReminderSentAt on vehicle
      dbStore.updateVehicle(vehicle.id, {
        lastReminderSentAt: new Date().toISOString()
      });

      return { ...evaluation, notificationSent: true };
    } catch (err) {
      console.error(`Failed to dispatch reminder notification for vehicle ${vehicle.id}:`, err);
      return { ...evaluation, notificationSent: false };
    }
  }

  /**
   * Process all vehicles across the entire system
   */
  public async checkAllVehicles(options: { force?: boolean } = {}) {
    const vehicles = dbStore.getVehicles();
    const results: ServiceReminderEvaluation[] = [];
    let sentCount = 0;

    for (const vehicle of vehicles) {
      const result = await this.evaluateAndNotify(vehicle, options);
      results.push(result);
      if (result.notificationSent) {
        sentCount++;
      }
    }

    return {
      totalVehicles: vehicles.length,
      notificationsSent: sentCount,
      evaluations: results
    };
  }

  /**
   * Start recurring background scheduler
   */
  public startScheduler(intervalMinutes = 60) {
    if (this.timer) {
      clearInterval(this.timer);
    }

    // Run initial check on server boot after a short delay (10s)
    setTimeout(() => {
      this.checkAllVehicles().catch((err) => {
        console.error('Initial service reminder check error:', err);
      });
    }, 10000);

    // Recurring interval
    this.timer = setInterval(() => {
      this.checkAllVehicles().catch((err) => {
        console.error('Periodic service reminder check error:', err);
      });
    }, intervalMinutes * 60 * 1000);

    console.log(`⏱️ Recurring service reminder scheduler started (interval: ${intervalMinutes} min).`);
  }

  public stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const serviceReminderService = new ServiceReminderService();
