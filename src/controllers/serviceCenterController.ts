import { Request, Response } from 'express';
import { dbStore, ServiceCenterWorkingStatus } from '../services/dbStore.ts';
import { RecommendationService } from '../services/recommendationService.ts';

/**
 * Controller for Service Center Management & AI Map Recommendations
 */
export const serviceCenterController = {
  /**
   * GET /api/service-centers/nearby
   * Returns nearby service centers from coordinates, sorted by recommendation score.
   */
  async getNearby(req: Request, res: Response): Promise<void> {
    const latStr = req.query.lat as string;
    const lngStr = req.query.lng as string;
    const radiusStr = req.query.radius as string;

    const lat = latStr ? parseFloat(latStr) : 28.6315;
    const lng = lngStr ? parseFloat(lngStr) : 77.2167;
    const radius = radiusStr ? parseFloat(radiusStr) : 50;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        message: 'Invalid coordinate parameters. Latitude and longitude must be numbers.'
      });
      return;
    }

    const nearbyCenters = RecommendationService.getRecommendations(lat, lng, radius);

    res.status(200).json({
      success: true,
      userLocation: { latitude: lat, longitude: lng },
      radiusKm: radius,
      count: nearbyCenters.length,
      serviceCenters: nearbyCenters
    });
  },

  /**
   * GET /api/service-centers/recommended
   * Returns AI recommended service centers with algorithm scoring breakdown.
   */
  async getRecommended(req: Request, res: Response): Promise<void> {
    const latStr = req.query.lat as string;
    const lngStr = req.query.lng as string;
    const radiusStr = req.query.radius as string;

    const lat = latStr ? parseFloat(latStr) : 28.6315;
    const lng = lngStr ? parseFloat(lngStr) : 77.2167;
    const radius = radiusStr ? parseFloat(radiusStr) : 50;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        message: 'Invalid coordinate parameters'
      });
      return;
    }

    const recommendations = RecommendationService.getRecommendations(lat, lng, radius);

    res.status(200).json({
      success: true,
      userLocation: { latitude: lat, longitude: lng },
      radiusKm: radius,
      algorithm: {
        formula: 'score = (rating/5 * 40) + (distanceScore * 30) + (serviceCountScore * 20) + (experienceScore * 10)',
        weights: {
          rating: '40%',
          distance: '30%',
          completedServices: '20%',
          experience: '10%'
        }
      },
      count: recommendations.length,
      recommendations
    });
  },

  /**
   * GET /api/service-centers
   * List all service centers with search & filtering
   */
  async getAll(req: Request, res: Response): Promise<void> {
    let centers = dbStore.getServiceCenters();
    const { city, search, verifiedOnly, minRating } = req.query;

    if (city && typeof city === 'string') {
      centers = centers.filter((c) => c.city.toLowerCase() === city.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const term = search.toLowerCase();
      centers = centers.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.address.toLowerCase().includes(term) ||
          c.city.toLowerCase().includes(term) ||
          (c.specialties && c.specialties.some((s) => s.toLowerCase().includes(term)))
      );
    }

    if (verifiedOnly === 'true') {
      centers = centers.filter((c) => c.isVerified);
    }

    if (minRating && typeof minRating === 'string') {
      const min = parseFloat(minRating);
      if (!isNaN(min)) {
        centers = centers.filter((c) => c.averageRating >= min);
      }
    }

    res.status(200).json({
      success: true,
      count: centers.length,
      serviceCenters: centers
    });
  },

  /**
   * GET /api/service-centers/:id
   * Complete service center details with active bookings
   */
  async getById(req: Request, res: Response): Promise<void> {
    const center = dbStore.getServiceCenterById(req.params.id);
    if (!center) {
      res.status(404).json({ success: false, message: 'Service center not found.' });
      return;
    }

    const allBookings = dbStore.getBookings();
    const centerBookings = allBookings.filter((b) => b.serviceCenterId === center.id);

    res.status(200).json({
      success: true,
      serviceCenter: {
        ...center,
        activeBookingsCount: centerBookings.filter(
          (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
        ).length,
        recentBookings: centerBookings.slice(-5)
      }
    });
  },

  /**
   * POST /api/service-centers
   * Create new service center (ADMIN)
   */
  async create(req: Request, res: Response): Promise<void> {
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

    const userRole = req.user?.role || 'ADMIN';
    const newCenter = dbStore.createServiceCenter({
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      phoneNumber: (phone || phoneNumber || '+91 11 4000 8800').trim(),
      ownerId: req.user?.userId || null,
      experienceYears: experienceYears ? parseInt(experienceYears) : 5,
      isVerified: userRole === 'ADMIN' ? Boolean(isVerified) : false,
      workingStatus: workingStatus || 'OPEN',
      availableMechanics: availableMechanics ? parseInt(availableMechanics) : 3,
      specialties: Array.isArray(specialties) ? specialties : ['Engine Diagnostics', 'Brake Service', 'EV Inspection'],
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=800&auto=format&fit=crop&q=80'
    });

    dbStore.addAuditLog({
      action: 'SERVICE_CENTER_CREATED',
      performedBy: req.user?.userId || 'system',
      performedByName: req.user?.email || 'Admin',
      performedByRole: req.user?.role || 'ADMIN',
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
  },

  /**
   * PUT / PATCH /api/service-centers/:id
   * Update service center (ADMIN or owner)
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const center = dbStore.getServiceCenterById(id);
    if (!center) {
      res.status(404).json({ success: false, message: 'Service center not found.' });
      return;
    }

    if (req.user?.role !== 'ADMIN' && center.ownerId !== req.user?.userId) {
      res.status(403).json({ success: false, message: 'Forbidden. You do not own this service center.' });
      return;
    }

    const updated = dbStore.updateServiceCenter(id, req.body);

    dbStore.addAuditLog({
      action: 'SERVICE_CENTER_UPDATED',
      performedBy: req.user?.userId || 'system',
      performedByName: req.user?.email || 'User',
      performedByRole: req.user?.role || 'ADMIN',
      targetType: 'SYSTEM',
      targetId: id,
      details: `Updated details for service center "${center.name}"`,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Service center updated successfully',
      serviceCenter: updated
    });
  },

  /**
   * PUT / PATCH /api/service-centers/:id/verify
   * Verify / Unverify service center (ADMIN only)
   */
  async verify(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { isVerified = true } = req.body;

    const updated = dbStore.verifyServiceCenter(id, Boolean(isVerified));
    if (!updated) {
      res.status(404).json({ success: false, message: 'Service center not found.' });
      return;
    }

    dbStore.addAuditLog({
      action: isVerified ? 'SERVICE_CENTER_VERIFIED' : 'SERVICE_CENTER_UNVERIFIED',
      performedBy: req.user?.userId || 'admin',
      performedByName: req.user?.email || 'Admin',
      performedByRole: 'ADMIN',
      targetType: 'SYSTEM',
      targetId: id,
      details: `Service center "${updated.name}" verification set to ${isVerified}`,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: `Service center "${updated.name}" is now ${isVerified ? 'Verified' : 'Unverified'}`,
      serviceCenter: updated
    });
  },

  /**
   * PUT / PATCH /api/service-centers/:id/status
   * Update operational status (MECHANIC or ADMIN)
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { workingStatus, isAvailable, availableMechanics } = req.body;

    let targetStatus: ServiceCenterWorkingStatus = 'OPEN';
    if (workingStatus) {
      targetStatus = workingStatus as ServiceCenterWorkingStatus;
    } else if (isAvailable !== undefined) {
      targetStatus = isAvailable ? 'OPEN' : 'BUSY';
    }

    const updated = dbStore.updateServiceCenterWorkingStatus(
      id,
      targetStatus,
      availableMechanics !== undefined ? parseInt(availableMechanics) : undefined
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Service center not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Service center status updated to ${targetStatus}`,
      serviceCenter: updated
    });
  },

  /**
   * POST /api/service-centers/:id/book
   * Create booking request directly at a specific service center (CUSTOMER)
   */
  async bookAtCenter(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { vehicleId, serviceType, preferredDate } = req.body;
    const customerId = req.user!.userId;

    const center = dbStore.getServiceCenterById(id);
    if (!center) {
      res.status(404).json({ success: false, message: 'Service center not found.' });
      return;
    }

    const vehicle = dbStore.getVehicleById(vehicleId);
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found.' });
      return;
    }

    if (req.user?.role === 'CUSTOMER' && vehicle.ownerId !== customerId) {
      res.status(403).json({ success: false, message: 'You can only book services for your own registered fleet vehicles.' });
      return;
    }

    const booking = dbStore.createBooking({
      vehicleId,
      customerId,
      serviceCenterId: id,
      serviceType: serviceType || 'Full Periodic Maintenance',
      preferredDate: preferredDate ? new Date(preferredDate).toISOString() : new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: `Service appointment booked at ${center.name}`,
      booking: {
        ...booking,
        serviceCenter: center,
        vehicle
      }
    });
  },

  /**
   * DELETE /api/service-centers/:id
   * Delete service center (ADMIN only)
   */
  async delete(req: Request, res: Response): Promise<void> {
    const success = dbStore.deleteServiceCenter(req.params.id);
    if (!success) {
      res.status(404).json({ success: false, message: 'Service center not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Service center deleted successfully.' });
  }
};
