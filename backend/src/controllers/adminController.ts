import { Request, Response } from 'express';
import { dbStore } from '../services/dbService.ts';

export const getAdminMetrics = async (req: Request, res: Response): Promise<void> => {
  const users = dbStore.getUsers();
  const vehicles = dbStore.getVehicles();
  const bookings = dbStore.getBookings();
  const invoices = dbStore.getInvoices();
  const serviceCenters = dbStore.getServiceCenters();

  const totalUsers = users.length;
  const totalVehicles = vehicles.length;
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length;
  const totalRevenue = invoices.filter((i) => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);

  res.status(200).json({
    metrics: {
      totalUsers,
      totalVehicles,
      totalBookings,
      activeBookings,
      totalRevenue,
      serviceCentersCount: serviceCenters.length
    }
  });
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const logs = dbStore.getAuditLogs();
  res.status(200).json({ logs, count: logs.length });
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  const reportType = (req.query.type as string) || 'REVENUE';
  const period = (req.query.period as string) || 'LAST_30_DAYS';
  const report = dbStore.getAdminReports(reportType, period);
  res.status(200).json({ report });
};
