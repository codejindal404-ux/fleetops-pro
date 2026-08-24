import { Request, Response } from 'express';
import { firebaseService } from '../services/firebaseService.ts';

export const getAdminMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await firebaseService.getCollection('users');
    const vehicles = await firebaseService.getCollection('vehicles');
    const bookings = await firebaseService.getCollection('bookings');
    const invoices = await firebaseService.getCollection('invoices');
    const serviceCenters = await firebaseService.getCollection('serviceCenters');

    const totalUsers = users.length;
    const totalVehicles = vehicles.length;
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter((b: any) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length;
    const totalRevenue = invoices.filter((i: any) => i.status === 'PAID').reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

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
  } catch (error: any) {
    console.error('getAdminMetrics error:', error);
    res.status(500).json({ message: 'Server error fetching admin metrics', error: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await firebaseService.getCollection('auditLogs');
    logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.status(200).json({ logs, count: logs.length });
  } catch (error: any) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ message: 'Server error fetching audit logs', error: error.message });
  }
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const reportType = (req.query.type as string) || 'REVENUE';
    const period = (req.query.period as string) || 'LAST_30_DAYS';

    const bookings = await firebaseService.getCollection('bookings');
    const invoices = await firebaseService.getCollection('invoices');
    const vehicles = await firebaseService.getCollection('vehicles');
    const users = await firebaseService.getCollection('users');

    const totalRevenue = invoices.filter((i: any) => i.status === 'PAID').reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
    const completedJobs = bookings.filter((b: any) => b.status === 'COMPLETED').length;

    const report = {
      reportType,
      period,
      generatedAt: new Date().toISOString(),
      summaryMetrics: {
        totalRevenue,
        totalJobs: bookings.length,
        completedJobs,
        activeCustomers: users.filter((u: any) => u.role === 'CUSTOMER').length,
        totalVehicles: vehicles.length
      },
      records: bookings.slice(0, 50)
    };

    res.status(200).json({ report });
  } catch (error: any) {
    console.error('getReports error:', error);
    res.status(500).json({ message: 'Server error generating reports', error: error.message });
  }
};
