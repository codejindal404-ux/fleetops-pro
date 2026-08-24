import { Request, Response } from 'express';
import { firebaseService } from '../services/firebaseService.ts';

export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const listings = await firebaseService.getCollection('marketplaceListings');
    res.status(200).json({ listings, count: listings.length });
  } catch (error: any) {
    console.error('getListings error:', error);
    res.status(500).json({ message: 'Server error fetching listings', error: error.message });
  }
};

export const createListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const sellerId = req.user!.userId;
    const seller = await firebaseService.getUserById(sellerId);
    const { title, brand, model, year, price, mileage, condition, vehicleType, description } = req.body;

    const listingId = `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const listing = await firebaseService.createDocument(
      'marketplaceListings',
      {
        title,
        brand,
        model,
        year: Number(year),
        price: Number(price),
        mileage: Number(mileage),
        condition: condition || 'VERY_GOOD',
        vehicleType: vehicleType || 'CAR',
        description: description || '',
        sellerId,
        sellerName: seller?.name || 'Seller',
        sellerRole: req.user!.role,
        status: 'AVAILABLE',
        verifiedByMechanic: req.user!.role === 'MECHANIC' || req.user!.role === 'ADMIN'
      },
      listingId
    );

    res.status(201).json({ message: 'Marketplace listing created successfully', listing });
  } catch (error: any) {
    console.error('createListing error:', error);
    res.status(500).json({ message: 'Server error creating listing', error: error.message });
  }
};
