import { Request, Response } from 'express';
import { ServiceCenter, ServiceCenterWorkingStatus, Booking, Vehicle } from '../types.ts';
import { firebaseService } from '../services/firebaseService.ts';
import { RecommendationService } from '../services/recommendationService.ts';

export const serviceCenterController = {
  /**
   * GET /api/service-centers/nearby
   */
  async getNearby(req: Request, res: Response): Promise<void> {
    try {
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

      const nearbyCenters = await RecommendationService.getRecommendations(lat, lng, radius);

      res.status(200).json({
        success: true,
        userLocation: { latitude: lat, longitude: lng },
        radiusKm: radius,
        count: nearbyCenters.length,
        serviceCenters: nearbyCenters
      });
    } catch (err: any) {
      console.error('getNearby error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch nearby service centers', error: err.message });
    }
  },

  /**
   * GET /api/service-centers/recommended
   */
  async getRecommended(req: Request, res: Response): Promise<void> {
    try {
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

      const recommendations = await RecommendationService.getRecommendations(lat, lng, radius);

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
    } catch (err: any) {
      console.error('getRecommended error:', err);
      res.status(500).json({ success: false, message: 'Failed to compute recommendations', error: err.message });
    }
  },

  /**
   * GET /api/service-centers
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      let centers = await firebaseService.getCollection<ServiceCenter>('serviceCenters');
      const { city, search, verifiedOnly, minRating } = req.query;

      if (city && typeof city === 'string') {
        centers = centers.filter((c) => (c.city || '').toLowerCase() === city.toLowerCase());
      }

      if (search && typeof search === 'string') {
        const term = search.toLowerCase();
        centers = centers.filter(
          (c) =>
            (c.name || '').toLowerCase().includes(term) ||
            (c.address || '').toLowerCase().includes(term) ||
            (c.city || '').toLowerCase().includes(term) ||
            (c.specialties && c.specialties.some((s) => s.toLowerCase().includes(term)))
        );
      }

      if (verifiedOnly === 'true') {
        centers = centers.filter((c) => c.isVerified);
      }

      if (minRating && typeof minRating === 'string') {
        const min = parseFloat(minRating);
        if (!isNaN(min)) {
          centers = centers.filter((c) => (c.averageRating || 0) >= min);
        }
      }

      res.status(200).json({
        success: true,
        count: centers.length,
        serviceCenters: centers
      });
    } catch (err: any) {
      console.error('getAll service centers error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch service centers', error: err.message });
    }
  },

  /**
   * GET /api/service-centers/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const center = await firebaseService.getDocument<ServiceCenter>('serviceCenters', req.params.id);
      if (!center) {
        res.status(404).json({ success: false, message: 'Service center not found.' });
        return;
      }

      const allBookings = await firebaseService.getCollection<Booking>('bookings', [{ field: 'serviceCenterId', op: '==', value: center.id }]);

      res.status(200).json({
        success: true,
        serviceCenter: {
          ...center,
          activeBookingsCount: allBookings.filter(
            (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
          ).length,
          recentBookings: allBookings.slice(-5)
        }
      });
    } catch (err: any) {
      console.error('getById service center error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch service center', error: err.message });
    }
  },

  /**
   * POST /api/service-centers
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
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
      const centerId = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newCenter = await firebaseService.createDocument<ServiceCenter>(
        'serviceCenters',
        {
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
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=800&auto=format&fit=crop&q=80',
          averageRating: 4.8,
          totalReviews: 0,
          totalServicesCompleted: 0
        },
        centerId
      );

      await firebaseService.createDocument('auditLogs', {
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
    } catch (err: any) {
      console.error('create service center error:', err);
      res.status(500).json({ success: false, message: 'Failed to create service center', error: err.message });
    }
  },

  /**
   * PUT / PATCH /api/service-centers/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const center = await firebaseService.getDocument<ServiceCenter>('serviceCenters', id);
      if (!center) {
        res.status(404).json({ success: false, message: 'Service center not found.' });
        return;
      }

      if (req.user?.role !== 'ADMIN' && center.ownerId !== req.user?.userId) {
        res.status(403).json({ success: false, message: 'Forbidden. You do not own this service center.' });
        return;
      }

      const updated = await firebaseService.updateDocument<ServiceCenter>('serviceCenters', id, req.body);

      await firebaseService.createDocument('auditLogs', {
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
    } catch (err: any) {
      console.error('update service center error:', err);
      res.status(500).json({ success: false, message: 'Failed to update service center', error: err.message });
    }
  },

  /**
   * PUT / PATCH /api/service-centers/:id/verify
   */
  async verify(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isVerified = true } = req.body;

      const updated = await firebaseService.updateDocument<ServiceCenter>('serviceCenters', id, { isVerified: Boolean(isVerified) });
      if (!updated) {
        res.status(404).json({ success: false, message: 'Service center not found.' });
        return;
      }

      await firebaseService.createDocument('auditLogs', {
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
    } catch (err: any) {
      console.error('verify service center error:', err);
      res.status(500).json({ success: false, message: 'Failed to verify service center', error: err.message });
    }
  },

  /**
   * PUT / PATCH /api/service-centers/:id/status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { workingStatus, isAvailable, availableMechanics } = req.body;

      let targetStatus: ServiceCenterWorkingStatus = 'OPEN';
      if (workingStatus) {
        targetStatus = workingStatus as ServiceCenterWorkingStatus;
      } else if (isAvailable !== undefined) {
        targetStatus = isAvailable ? 'OPEN' : 'BUSY';
      }

      const updates: any = { workingStatus: targetStatus };
      if (availableMechanics !== undefined) {
        updates.availableMechanics = parseInt(availableMechanics);
      }

      const updated = await firebaseService.updateDocument<ServiceCenter>('serviceCenters', id, updates);

      if (!updated) {
        res.status(404).json({ success: false, message: 'Service center not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Service center status updated to ${targetStatus}`,
        serviceCenter: updated
      });
    } catch (err: any) {
      console.error('updateStatus service center error:', err);
      res.status(500).json({ success: false, message: 'Failed to update service center status', error: err.message });
    }
  },

  /**
   * POST /api/service-centers/:id/book
   */
  async bookAtCenter(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { vehicleId, serviceType, preferredDate } = req.body;
      const customerId = req.user!.userId;

      const center = await firebaseService.getDocument<ServiceCenter>('serviceCenters', id);
      if (!center) {
        res.status(404).json({ success: false, message: 'Service center not found.' });
        return;
      }

      const vehicle = await firebaseService.getDocument<Vehicle>('vehicles', vehicleId);
      if (!vehicle) {
        res.status(404).json({ success: false, message: 'Vehicle not found.' });
        return;
      }

      if (req.user?.role === 'CUSTOMER' && vehicle.ownerId !== customerId) {
        res.status(403).json({ success: false, message: 'You can only book services for your own registered fleet vehicles.' });
        return;
      }

      const bookingId = `BK_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const booking = await firebaseService.createDocument<Booking>(
        'bookings',
        {
          vehicleId,
          customerId,
          serviceCenterId: id,
          serviceType: serviceType || 'Full Periodic Maintenance',
          preferredDate: preferredDate ? new Date(preferredDate).toISOString() : new Date().toISOString(),
          status: 'PENDING',
          progressPercentage: 0
        },
        bookingId
      );

      res.status(201).json({
        success: true,
        message: `Service appointment booked at ${center.name}`,
        booking: {
          ...booking,
          serviceCenter: center,
          vehicle
        }
      });
    } catch (err: any) {
      console.error('bookAtCenter error:', err);
      res.status(500).json({ success: false, message: 'Failed to book appointment at service center', error: err.message });
    }
  },

  /**
   * DELETE /api/service-centers/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const success = await firebaseService.deleteDocument('serviceCenters', req.params.id);
      if (!success) {
        res.status(404).json({ success: false, message: 'Service center not found.' });
        return;
      }

      res.status(200).json({ success: true, message: 'Service center deleted successfully.' });
    } catch (err: any) {
      console.error('delete service center error:', err);
      res.status(500).json({ success: false, message: 'Failed to delete service center', error: err.message });
    }
  }
};

export default serviceCenterController;
