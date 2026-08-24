export interface MechanicPerformanceModel {
  id: string;
  mechanicId: string;
  completedJobs: number;
  activeJobs: number;
  averageRepairTime?: number;
  customerRating: number;
  efficiencyScore: number;
}
