import { dbStore } from './dbStore.ts';

export interface AIDiagnosticResult {
  vehicleId: string;
  healthScore: number;
  engineStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  batteryVoltage: number;
  dtcCodes: string[];
  recommendedActions: string[];
  analyzedAt: string;
}

export class AIDiagnosticService {
  public analyzeVehicleHealth(vehicleId: string): AIDiagnosticResult {
    const vehicle = dbStore.getVehicleById(vehicleId);
    
    let healthScore = 95;
    const dtcCodes: string[] = [];
    const recommendedActions: string[] = [];

    if (vehicle) {
      if (vehicle.reminderStatus === 'OVERDUE') {
        healthScore -= 30;
        dtcCodes.push('P0171');
        recommendedActions.push('Overdue maintenance: Immediate oil & filter replacement required.');
      } else if (vehicle.reminderStatus === 'DUE_SOON') {
        healthScore -= 15;
        recommendedActions.push('Schedule preventive maintenance within 30 days.');
      }
    }

    healthScore = Math.max(20, Math.min(100, healthScore));

    let engineStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (healthScore < 50) engineStatus = 'CRITICAL';
    else if (healthScore < 80) engineStatus = 'WARNING';

    if (recommendedActions.length === 0) {
      recommendedActions.push('Perform routine fluids and tire pressure check.');
    }

    return {
      vehicleId,
      healthScore,
      engineStatus,
      batteryVoltage: 12.6,
      dtcCodes,
      recommendedActions,
      analyzedAt: new Date().toISOString()
    };
  }
}

export const aiDiagnosticService = new AIDiagnosticService();
