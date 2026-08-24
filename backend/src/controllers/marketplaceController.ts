import { Request, Response } from 'express';
import { dbStore } from '../services/dbService.ts';

export const getListings = async (req: Request, res: Response): Promise<void> => {
  const listings = dbStore.getMarketplaceListings();
  res.status(200).json({ listings, count: listings.length });
};

export const createListing = async (req: Request, res: Response): Promise<void> => {
  const sellerId = req.user!.userId;
  const seller = dbStore.getUserById(sellerId);
  const { title, brand, model, year, price, mileage, condition, vehicleType, description } = req.body;

  const listing = dbStore.createMarketplaceListing({
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
  });

  res.status(201).json({ message: 'Marketplace listing created successfully', listing });
};
