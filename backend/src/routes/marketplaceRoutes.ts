import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';
import { dbStore } from '../services/dbStore.ts';

const router = Router();

// Protect marketplace routes to authenticated users
router.use(authMiddleware);

// GET /api/marketplace & /api/marketplace/listings - Get available listings
const getListingsHandler = (req: Request, res: Response): void => {
  const listings = dbStore.getMarketplaceListings();
  res.status(200).json({
    listings,
    count: listings.length
  });
};

router.get('/', getListingsHandler);
router.get('/listings', getListingsHandler);

// POST /api/marketplace - Create marketplace listing (Admin, Mechanic, or Customer)
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Listing title is required'),
    body('brand').trim().notEmpty().withMessage('Brand is required'),
    body('model').trim().notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
    body('price').isFloat({ min: 100 }).withMessage('Price must be greater than 100'),
    body('mileage').isInt({ min: 0 }).withMessage('Mileage must be positive'),
    body('condition').isIn(['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR']).withMessage('Invalid condition grade'),
    body('vehicleType').optional().isIn(['CAR', 'TRUCK', 'VAN', 'BUS', 'MOTORCYCLE']).withMessage('Invalid vehicle type')
  ],
  (req: Request, res: Response): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { title, brand, model, year, price, mileage, condition, vehicleType, description } = req.body;
    const { userId, role } = req.user!;
    const user = dbStore.getUserById(userId);

    const isMechanicOrAdmin = role === 'MECHANIC' || role === 'ADMIN';

    const newListing = dbStore.createMarketplaceListing({
      title: title.trim(),
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      price: Number(price),
      mileage: Number(mileage),
      condition: condition || 'VERY_GOOD',
      vehicleType: vehicleType || 'CAR',
      description: (description || '').trim(),
      verifiedByMechanic: isMechanicOrAdmin,
      verifierMechanicId: isMechanicOrAdmin ? userId : null,
      verifierMechanicName: isMechanicOrAdmin ? user?.name : null,
      sellerId: userId,
      sellerName: user?.name || 'Seller',
      sellerRole: role,
      status: 'AVAILABLE'
    });

    dbStore.addAuditLog({
      action: 'CREATE_MARKETPLACE_LISTING',
      performedBy: userId,
      performedByName: user?.name || 'User',
      performedByRole: role,
      targetType: 'MARKETPLACE',
      targetId: newListing.id,
      details: `${role} created vehicle marketplace listing "${newListing.title}" for $${newListing.price.toLocaleString()}.`,
      status: 'SUCCESS'
    });

    res.status(201).json({
      message: 'Marketplace listing created successfully',
      listing: newListing
    });
  }
);

// POST /api/marketplace/:id/inquire - Customer sends purchase inquiry (Customer role only)
router.post(
  '/:id/inquire',
  restrictTo('CUSTOMER'),
  [
    body('message').trim().notEmpty().withMessage('Inquiry message is required'),
    body('phone').optional().trim(),
    body('offerPrice').optional().isFloat({ min: 1 })
  ],
  (req: Request, res: Response): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
      return;
    }

    const { id } = req.params;
    const { message, phone, offerPrice } = req.body;
    const userId = req.user!.userId;
    const user = dbStore.getUserById(userId);

    const listing = dbStore.getMarketplaceListingById(id);
    if (!listing) {
      res.status(404).json({ message: 'Marketplace listing not found.' });
      return;
    }

    const inquiry = dbStore.createInquiry({
      listingId: id,
      customerId: userId,
      customerName: user?.name || 'Interested Buyer',
      customerEmail: user?.email || '',
      phone: phone || user?.phone || '',
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      message: message.trim()
    });

    dbStore.addAuditLog({
      action: 'MARKETPLACE_INQUIRY',
      performedBy: userId,
      performedByName: user?.name || 'Customer',
      performedByRole: 'CUSTOMER',
      targetType: 'MARKETPLACE',
      targetId: id,
      details: `Customer submitted purchase inquiry for "${listing.title}".`,
      status: 'SUCCESS'
    });

    res.status(201).json({
      message: 'Purchase inquiry sent successfully to seller',
      inquiry
    });
  }
);

export const marketplaceRoutes = router;
export default router;

