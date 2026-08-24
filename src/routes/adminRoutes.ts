import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';
import { dbStore, Role, BookingStatus } from '../services/dbStore.ts';
import { validateBookingStatusTransition } from '../utils/statusTransitions.ts';
import { notificationService } from '../services/notificationService.ts';

const router = Router();

// Protect ALL admin routes to ADMIN role only
router.use(authMiddleware);
router.use(restrictTo('ADMIN'));

// GET /api/admin/users - Get all users
router.get('/users', (req: Request, res: Response) => {
  const users = dbStore.getUsers().map(({ password, ...u }) => u);
  res.status(200).json({
    users,
    count: users.length
  });
});

// POST /api/admin/create-mechanic - Create mechanic staff account
router.post(
  '/create-mechanic',
  [
    body('name').trim().notEmpty().withMessage('Mechanic name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim()
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { name, email, password, phone } = req.body;
    const adminUser = dbStore.getUserById(req.user!.userId);

    const existingUser = dbStore.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newMechanic = dbStore.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: (phone || '').trim(),
      role: 'MECHANIC'
    });

    // Record audit log
    dbStore.addAuditLog({
      action: 'CREATE_MECHANIC',
      performedBy: req.user!.userId,
      performedByName: adminUser?.name || 'Administrator',
      performedByRole: 'ADMIN',
      targetType: 'USER',
      targetId: newMechanic.id,
      details: `Created new certified mechanic account for ${newMechanic.name} (${newMechanic.email}).`,
      status: 'SUCCESS'
    });

    const { password: _, ...safeUser } = newMechanic;
    res.status(201).json({
      message: `Mechanic account created successfully for ${newMechanic.name}`,
      user: safeUser
    });
  }
);

// POST /api/admin/create-user - Create staff or customer account with specified role
router.post(
  '/create-user',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['ADMIN', 'MECHANIC', 'CUSTOMER']).withMessage('Role must be ADMIN, MECHANIC, or CUSTOMER'),
    body('phone').optional().trim()
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { name, email, password, phone, role } = req.body;
    const adminUser = dbStore.getUserById(req.user!.userId);

    const existingUser = dbStore.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = dbStore.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: (phone || '').trim(),
      role: role as Role
    });

    dbStore.addAuditLog({
      action: `CREATE_${role}_USER`,
      performedBy: req.user!.userId,
      performedByName: adminUser?.name || 'Administrator',
      performedByRole: 'ADMIN',
      targetType: 'USER',
      targetId: newUser.id,
      details: `Administrator provisioned new user '${newUser.name}' with role '${role}'.`,
      status: 'SUCCESS'
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({
      message: `User created successfully with role ${role}`,
      user: safeUser
    });
  }
);

// GET /api/admin/audit-logs - View audit logs
router.get('/audit-logs', (req: Request, res: Response) => {
  const auditLogs = dbStore.getAuditLogs();
  res.status(200).json({
    auditLogs,
    count: auditLogs.length
  });
});

// GET /api/admin/analytics - Detailed RBAC analytics dashboard metrics
router.get('/analytics', (req: Request, res: Response) => {
  const summary = dbStore.getAnalyticsSummary();
  res.status(200).json({
    analytics: summary
  });
});

// DELETE /api/admin/users/:id - Delete user account
router.delete('/users/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const adminUser = dbStore.getUserById(req.user!.userId);
  const targetUser = dbStore.getUserById(id);

  if (!targetUser) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  if (targetUser.role === 'ADMIN') {
    const adminCount = dbStore.getUsers().filter((u) => u.role === 'ADMIN').length;
    if (adminCount <= 1) {
      res.status(400).json({ message: 'Cannot delete the primary administrator account.' });
      return;
    }
  }

  const deleted = dbStore.deleteUser(id);
  if (!deleted) {
    res.status(500).json({ message: 'Failed to delete user.' });
    return;
  }

  dbStore.addAuditLog({
    action: 'DELETE_USER',
    performedBy: req.user!.userId,
    performedByName: adminUser?.name || 'Administrator',
    performedByRole: 'ADMIN',
    targetType: 'USER',
    targetId: id,
    details: `Administrator deleted user account '${targetUser.name}' (${targetUser.email}) with role '${targetUser.role}'.`,
    status: 'SUCCESS'
  });

  res.status(200).json({
    message: `User ${targetUser.name} deleted successfully.`
  });
});

// PUT / PATCH /api/admin/users/:id - Update user details
const handleAdminUpdateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, phone, role, password, newPassword } = req.body;
  const adminUser = dbStore.getUserById(req.user!.userId);
  const targetUser = dbStore.getUserById(id);

  if (!targetUser) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  const updates: any = {};
  if (name !== undefined) updates.name = name.trim();
  if (email !== undefined && email.trim() !== targetUser.email) {
    const existing = dbStore.getUserByEmail(email);
    if (existing && existing.id !== id) {
      res.status(400).json({ message: 'Email is already taken by another account.' });
      return;
    }
    updates.email = email.trim().toLowerCase();
  }
  if (phone !== undefined) updates.phone = phone.trim();
  if (role !== undefined && ['ADMIN', 'MECHANIC', 'CUSTOMER'].includes(role)) {
    updates.role = role;
  }
  const pwd = password || newPassword;
  if (pwd && pwd.length >= 6) {
    updates.password = await bcrypt.hash(pwd, 10);
  }

  const updated = dbStore.updateUser(id, updates);
  if (!updated) {
    res.status(500).json({ message: 'Failed to update user profile.' });
    return;
  }

  dbStore.addAuditLog({
    action: 'UPDATE_USER_ADMIN',
    performedBy: req.user!.userId,
    performedByName: adminUser?.name || 'Administrator',
    performedByRole: 'ADMIN',
    targetType: 'USER',
    targetId: id,
    details: `Administrator updated user profile for '${updated.name}' (${updated.email}). Role: ${updated.role}`,
    status: 'SUCCESS'
  });

  const { password: _, ...safeUser } = updated;
  res.status(200).json({
    message: `User profile for '${updated.name}' updated successfully.`,
    user: safeUser
  });
};

router.put('/users/:id', handleAdminUpdateUser);
router.patch('/users/:id', handleAdminUpdateUser);

// PATCH /api/admin/bookings/:id/assign - Assign mechanic to service booking
router.patch(
  '/bookings/:id/assign',
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const mechanicId = req.body.mechanicId || req.body.assignedMechanicId;
    if (!mechanicId) {
      res.status(400).json({ message: 'mechanicId or assignedMechanicId is required' });
      return;
    }

    const adminUser = dbStore.getUserById(req.user!.userId);

    const booking = dbStore.getBookingById(id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    const mechanic = dbStore.getUserById(mechanicId);
    if (!mechanic || mechanic.role !== 'MECHANIC') {
      res.status(400).json({ message: 'Target user must exist and have the MECHANIC role.' });
      return;
    }

    let nextStatus: BookingStatus = booking.status;
    if (booking.status === 'PENDING' || booking.status === 'APPROVED') {
      nextStatus = 'ASSIGNED';
    }

    const updated = dbStore.updateBookingStatus(id, nextStatus, mechanicId, mechanic.name);

    dbStore.addAuditLog({
      action: 'ASSIGN_MECHANIC',
      performedBy: req.user!.userId,
      performedByName: adminUser?.name || 'Administrator',
      performedByRole: 'ADMIN',
      targetType: 'BOOKING',
      targetId: id,
      details: `Assigned Mechanic ${mechanic.name} to booking ${id}. Status set to ${nextStatus}.`,
      status: 'SUCCESS'
    });

    // Real-time notifications
    try {
      const vehicle = dbStore.getVehicleById(booking.vehicleId);
      const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : 'Vehicle';

      // 1. Notify Mechanic (exact requirement: Type: MECHANIC_ASSIGNED, Receiver: Selected mechanic, Message: "New service job assigned to your bay")
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

      // 2. Notify Customer
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
      console.error('Failed to dispatch assignment notification:', err);
    }

    res.status(200).json({
      message: `Mechanic ${mechanic.name} assigned to booking ${id}`,
      booking: updated
    });
  }
);

// PATCH /api/admin/bookings/:id/approve - Approve pending service booking
router.patch('/bookings/:id/approve', (req: Request, res: Response): void => {
  const { id } = req.params;
  const adminUser = dbStore.getUserById(req.user!.userId);
  const booking = dbStore.getBookingById(id);

  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  const validation = validateBookingStatusTransition(booking.status, 'APPROVED');
  if (!validation.valid) {
    res.status(400).json({ message: validation.reason });
    return;
  }

  const updated = dbStore.updateBookingStatus(id, 'APPROVED');

  dbStore.addAuditLog({
    action: 'APPROVE_SERVICE_BOOKING',
    performedBy: req.user!.userId,
    performedByName: adminUser?.name || 'Administrator',
    performedByRole: 'ADMIN',
    targetType: 'BOOKING',
    targetId: id,
    details: `Administrator approved service request ${id}.`,
    status: 'SUCCESS'
  });

  res.status(200).json({
    message: `Booking ${id} approved successfully`,
    booking: updated
  });
});

// GET /api/admin/service-centers - List all service centers for admin
router.get('/service-centers', (req: Request, res: Response) => {
  const centers = dbStore.getServiceCenters();
  res.status(200).json({
    success: true,
    count: centers.length,
    serviceCenters: centers
  });
});

// GET /api/admin/service-centers/:id/analytics - Get detailed service center analytics
router.get('/service-centers/:id/analytics', (req: Request, res: Response): void => {
  const { id } = req.params;
  const analytics = dbStore.getServiceCenterAnalytics(id);
  if (!analytics) {
    res.status(404).json({ success: false, message: 'Service center not found.' });
    return;
  }
  res.status(200).json({
    success: true,
    analytics
  });
});

// POST /api/admin/service-centers - Create service center
router.post('/service-centers', async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    address,
    city,
    latitude,
    longitude,
    phone,
    phoneNumber,
    experienceYears,
    specialties,
    imageUrl,
    workingStatus,
    availableMechanics,
    isVerified
  } = req.body;

  if (!name || !address || !city || latitude === undefined || longitude === undefined) {
    res.status(400).json({
      success: false,
      message: 'Name, address, city, latitude, and longitude are required.'
    });
    return;
  }

  const newCenter = dbStore.createServiceCenter({
    name: name.trim(),
    address: address.trim(),
    city: city.trim(),
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    phoneNumber: (phone || phoneNumber || '+91 11 4000 8800').trim(),
    ownerId: req.user?.userId || null,
    experienceYears: experienceYears ? parseInt(experienceYears) : 5,
    isVerified: Boolean(isVerified),
    workingStatus: workingStatus || 'OPEN',
    availableMechanics: availableMechanics ? parseInt(availableMechanics) : 3,
    specialties: Array.isArray(specialties) ? specialties : ['Engine Diagnostics', 'Brake Service', 'EV Inspection'],
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=800&auto=format&fit=crop&q=80'
  });

  dbStore.addAuditLog({
    action: 'SERVICE_CENTER_CREATED',
    performedBy: req.user!.userId,
    performedByName: req.user?.email || 'Admin',
    performedByRole: 'ADMIN',
    targetType: 'SYSTEM',
    targetId: newCenter.id,
    details: `Created new service center "${newCenter.name}" in ${newCenter.city}`,
    status: 'SUCCESS'
  });

  res.status(201).json({
    success: true,
    message: 'Service center created successfully',
    serviceCenter: newCenter
  });
});

// PUT & PATCH /api/admin/service-centers/:id/verify - Verify or unverify a service center
router.put('/service-centers/:id/verify', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { isVerified = true } = req.body;
  const adminUser = dbStore.getUserById(req.user!.userId);

  const updated = dbStore.verifyServiceCenter(id, Boolean(isVerified));
  if (!updated) {
    res.status(404).json({ message: 'Service center not found.' });
    return;
  }

  dbStore.addAuditLog({
    action: isVerified ? 'SERVICE_CENTER_VERIFIED' : 'SERVICE_CENTER_UNVERIFIED',
    performedBy: req.user!.userId,
    performedByName: adminUser?.name || 'Administrator',
    performedByRole: 'ADMIN',
    targetType: 'SYSTEM',
    targetId: id,
    details: `Administrator ${isVerified ? 'verified' : 'unverified'} service center "${updated.name}" (${updated.city})`,
    status: 'SUCCESS'
  });

  res.status(200).json({
    message: `Service center "${updated.name}" is now ${isVerified ? 'Verified' : 'Unverified'}`,
    serviceCenter: updated
  });
});

router.patch('/service-centers/:id/verify', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { isVerified = true } = req.body;
  const adminUser = dbStore.getUserById(req.user!.userId);

  const updated = dbStore.verifyServiceCenter(id, Boolean(isVerified));
  if (!updated) {
    res.status(404).json({ message: 'Service center not found.' });
    return;
  }

  dbStore.addAuditLog({
    action: isVerified ? 'SERVICE_CENTER_VERIFIED' : 'SERVICE_CENTER_UNVERIFIED',
    performedBy: req.user!.userId,
    performedByName: adminUser?.name || 'Administrator',
    performedByRole: 'ADMIN',
    targetType: 'SYSTEM',
    targetId: id,
    details: `Administrator ${isVerified ? 'verified' : 'unverified'} service center "${updated.name}" (${updated.city})`,
    status: 'SUCCESS'
  });

  res.status(200).json({
    message: `Service center "${updated.name}" is now ${isVerified ? 'Verified' : 'Unverified'}`,
    serviceCenter: updated
  });
});

// DELETE /api/admin/service-centers/:id - Delete service center
router.delete('/service-centers/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const success = dbStore.deleteServiceCenter(id);
  if (!success) {
    res.status(404).json({ success: false, message: 'Service center not found.' });
    return;
  }

  dbStore.addAuditLog({
    action: 'SERVICE_CENTER_DELETED',
    performedBy: req.user!.userId,
    performedByName: req.user?.email || 'Admin',
    performedByRole: 'ADMIN',
    targetType: 'SYSTEM',
    targetId: id,
    details: `Deleted service center ID ${id}`,
    status: 'SUCCESS'
  });

  res.status(200).json({ success: true, message: 'Service center deleted successfully.' });
});

// ================= ENTERPRISE ADMIN CONTROL CENTER APIS =================

// GET /api/admin/dashboard - Enterprise KPI overview & telemetry
router.get('/dashboard', (req: Request, res: Response): void => {
  const data = dbStore.getEnterpriseAdminDashboardData();
  res.status(200).json({
    success: true,
    data
  });
});

// GET /api/admin/customers - Enriched customer fleet roster
router.get('/customers', (req: Request, res: Response): void => {
  const customers = dbStore.getAdminCustomers();
  res.status(200).json({
    success: true,
    count: customers.length,
    customers
  });
});

// GET /api/admin/mechanics - Mechanic staffing & performance metrics
router.get('/mechanics', (req: Request, res: Response): void => {
  const mechanics = dbStore.getAdminMechanics();
  res.status(200).json({
    success: true,
    count: mechanics.length,
    mechanics
  });
});

// GET /api/admin/reports - Enterprise Report generation
router.get('/reports', (req: Request, res: Response): void => {
  const reportType = (req.query.type as string) || 'REVENUE';
  const period = (req.query.period as string) || 'LAST_30_DAYS';
  const report = dbStore.getAdminReports(reportType, period);
  res.status(200).json({
    success: true,
    report
  });
});

// POST /api/admin/service-center - Alias for creating service center
router.post('/service-center', async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    address,
    city,
    latitude,
    longitude,
    phone,
    phoneNumber,
    experienceYears,
    specialties,
    imageUrl,
    workingStatus,
    availableMechanics,
    isVerified
  } = req.body;

  if (!name || !address || !city || latitude === undefined || longitude === undefined) {
    res.status(400).json({
      success: false,
      message: 'Name, address, city, latitude, and longitude are required.'
    });
    return;
  }

  const newCenter = dbStore.createServiceCenter({
    name: name.trim(),
    address: address.trim(),
    city: city.trim(),
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    phoneNumber: (phone || phoneNumber || '+91 11 4000 8800').trim(),
    ownerId: req.user?.userId || null,
    experienceYears: experienceYears ? parseInt(experienceYears) : 5,
    isVerified: Boolean(isVerified),
    workingStatus: workingStatus || 'OPEN',
    availableMechanics: availableMechanics ? parseInt(availableMechanics) : 3,
    specialties: Array.isArray(specialties) ? specialties : ['Engine Diagnostics', 'Brake Service', 'EV Inspection'],
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=800&auto=format&fit=crop&q=80'
  });

  dbStore.addAuditLog({
    action: 'SERVICE_CENTER_CREATED',
    performedBy: req.user!.userId,
    performedByName: req.user?.email || 'Admin',
    performedByRole: 'ADMIN',
    targetType: 'SYSTEM',
    targetId: newCenter.id,
    details: `Created new service center "${newCenter.name}" in ${newCenter.city}`,
    status: 'SUCCESS'
  });

  res.status(201).json({
    success: true,
    message: 'Service center created successfully',
    serviceCenter: newCenter
  });
});

// PATCH /api/admin/users/:id/status - Suspend or reactivate user account
router.patch('/users/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
    res.status(400).json({ success: false, message: "Status must be either 'ACTIVE' or 'SUSPENDED'." });
    return;
  }

  const adminUser = dbStore.getUserById(req.user!.userId);
  const updatedUser = dbStore.toggleUserStatus(id, status);
  if (!updatedUser) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  dbStore.addAuditLog({
    action: status === 'SUSPENDED' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
    performedBy: req.user!.userId,
    performedByName: adminUser?.name || 'Administrator',
    performedByRole: 'ADMIN',
    targetType: 'USER',
    targetId: id,
    details: `Administrator ${status === 'SUSPENDED' ? 'suspended' : 'activated'} account for ${updatedUser.name} (${updatedUser.email}).`,
    status: 'SUCCESS'
  });

  res.status(200).json({
    success: true,
    message: `User account is now ${status.toLowerCase()}`,
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status
    }
  });
});

// POST /api/admin/users/:id/reset-password - Admin reset user password
router.post('/users/:id/reset-password', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { newPassword = 'Password123!' } = req.body;
  const adminUser = dbStore.getUserById(req.user!.userId);

  const ok = dbStore.resetUserPassword(id, newPassword);
  if (!ok) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  dbStore.addAuditLog({
    action: 'ADMIN_RESET_PASSWORD',
    performedBy: req.user!.userId,
    performedByName: adminUser?.name || 'Administrator',
    performedByRole: 'ADMIN',
    targetType: 'USER',
    targetId: id,
    details: `Administrator reset password for user ID ${id}. Temporary password assigned.`,
    status: 'SUCCESS'
  });

  res.status(200).json({
    success: true,
    message: 'User password reset successfully to default credentials.'
  });
});

// PATCH /api/admin/service-centers/:id/status & /api/admin/service-center/:id/status
const handleServiceCenterStatusPatch = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { workingStatus, isVerified, name, address, phone } = req.body;
  const adminUser = dbStore.getUserById(req.user!.userId);

  const updated = dbStore.updateServiceCenterStatus(id, { workingStatus, isVerified, name, address, phone });
  if (!updated) {
    res.status(404).json({ success: false, message: 'Service center not found.' });
    return;
  }

  dbStore.addAuditLog({
    action: 'UPDATE_SERVICE_CENTER',
    performedBy: req.user!.userId,
    performedByName: adminUser?.name || 'Administrator',
    performedByRole: 'ADMIN',
    targetType: 'SYSTEM',
    targetId: id,
    details: `Updated service center "${updated.name}" status: ${workingStatus || updated.workingStatus}, verified: ${updated.isVerified}`,
    status: 'SUCCESS'
  });

  res.status(200).json({
    success: true,
    message: `Service center "${updated.name}" updated successfully.`,
    serviceCenter: updated
  });
};

router.patch('/service-centers/:id/status', handleServiceCenterStatusPatch);
router.patch('/service-center/:id/status', handleServiceCenterStatusPatch);

// PATCH /api/admin/bookings/:id/change-center - Reassign service center
router.patch('/bookings/:id/change-center', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { serviceCenterId } = req.body;

  if (!serviceCenterId) {
    res.status(400).json({ success: false, message: 'serviceCenterId is required' });
    return;
  }

  const updated = dbStore.updateBookingServiceCenter(id, serviceCenterId);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Booking not found.' });
    return;
  }

  const center = dbStore.getServiceCenterById(serviceCenterId);
  dbStore.addAuditLog({
    action: 'TRANSFER_BOOKING_CENTER',
    performedBy: req.user!.userId,
    performedByName: req.user?.email || 'Admin',
    performedByRole: 'ADMIN',
    targetType: 'BOOKING',
    targetId: id,
    details: `Reassigned booking ${id} to ${center?.name || serviceCenterId}`,
    status: 'SUCCESS'
  });

  res.status(200).json({
    success: true,
    message: `Booking reassigned to ${center?.name || 'new garage'}`,
    booking: updated
  });
});

// PATCH /api/admin/bookings/:id/cancel - Admin cancel booking
router.patch('/bookings/:id/cancel', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { reason = 'Cancelled by administrator' } = req.body;

  const updated = dbStore.cancelBookingByAdmin(id, reason);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Booking not found.' });
    return;
  }

  dbStore.addAuditLog({
    action: 'CANCEL_BOOKING_ADMIN',
    performedBy: req.user!.userId,
    performedByName: req.user?.email || 'Admin',
    performedByRole: 'ADMIN',
    targetType: 'BOOKING',
    targetId: id,
    details: `Administrator cancelled booking ${id}: ${reason}`,
    status: 'SUCCESS'
  });

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully.',
    booking: updated
  });
});

// Inventory & Services Catalog APIs
const getServicesInventoryHandler = (req: Request, res: Response): void => {
  const items = dbStore.getServicesInventory();
  res.status(200).json({
    success: true,
    count: items.length,
    items
  });
};

router.get('/services-inventory', getServicesInventoryHandler);
router.get('/inventory', getServicesInventoryHandler);

router.post('/services-inventory', (req: Request, res: Response): void => {
  const { name, category, code, price, costPrice, stockQuantity, reorderLevel, estimatedDurationMins, description } = req.body;

  if (!name || !category || price === undefined) {
    res.status(400).json({ success: false, message: 'Name, category, and price are required.' });
    return;
  }

  const newItem = dbStore.createServicesInventoryItem({
    name,
    category,
    code: code || `SRV-${Date.now().toString().slice(-4)}`,
    price: parseFloat(price),
    costPrice: costPrice ? parseFloat(costPrice) : parseFloat(price) * 0.5,
    stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity) : 50,
    reorderLevel: reorderLevel !== undefined ? parseInt(reorderLevel) : 10,
    estimatedDurationMins: estimatedDurationMins ? parseInt(estimatedDurationMins) : 45,
    status: (stockQuantity || 50) <= 0 ? 'OUT_OF_STOCK' : (stockQuantity || 50) <= (reorderLevel || 10) ? 'LOW_STOCK' : 'IN_STOCK',
    description: description || 'Professional fleet maintenance item.'
  });

  dbStore.addAuditLog({
    action: 'CREATE_INVENTORY_ITEM',
    performedBy: req.user!.userId,
    performedByName: req.user?.email || 'Admin',
    performedByRole: 'ADMIN',
    targetType: 'SYSTEM',
    targetId: newItem.id,
    details: `Added new service/inventory item: ${newItem.name} (${newItem.code})`,
    status: 'SUCCESS'
  });

  res.status(201).json({
    success: true,
    message: 'Service/inventory item created successfully',
    item: newItem
  });
});

router.put('/services-inventory/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const updated = dbStore.updateServicesInventoryItem(id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Item not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Item updated successfully',
    item: updated
  });
});

router.delete('/services-inventory/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const deleted = dbStore.deleteServicesInventoryItem(id);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Item not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Item deleted successfully.'
  });
});

// GET /api/admin/ai-insights - AI Recommendations Engine
router.get('/ai-insights', (req: Request, res: Response): void => {
  const insights = dbStore.getAIBusinessInsights();
  res.status(200).json({
    success: true,
    count: insights.length,
    insights
  });
});

export const adminRoutes = router;
export default router;


