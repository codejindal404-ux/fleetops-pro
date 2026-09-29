export interface VehicleModelSpec {
  model: string;
  type: string; // e.g. 'Sedan', 'SUV', 'Hatchback', 'Electric Vehicles (EV)', 'Truck', 'Motorcycle', etc.
  fuel: Array<'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'CNG' | 'LPG' | 'Hydrogen'>;
  transmissions?: Array<'Manual' | 'Automatic' | 'CVT' | 'Dual-Clutch' | 'Single-Speed'>;
  defaultBatteryCapacity?: number; // kWh for EV
  defaultRange?: number; // km for EV
}

export interface VehicleCompanyRecord {
  company: string;
  country: string;
  category: string;
  logo?: string;
  vehicles: VehicleModelSpec[];
}

export const VEHICLE_CATEGORIES = [
  'Cars',
  'SUVs',
  'Sedans',
  'Hatchbacks',
  'Luxury Cars',
  'Sports Cars',
  'Electric Vehicles (EV)',
  'Hybrid Vehicles',
  'Motorcycles',
  'Scooters',
  'Trucks',
  'Pickup Trucks',
  'Buses',
  'Vans',
  'Commercial Vehicles',
  'Construction Vehicles',
  'Agricultural Vehicles',
  'Emergency Vehicles',
  'Heavy Machinery'
] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const GLOBAL_VEHICLE_DATABASE: VehicleCompanyRecord[] = [
  // ==========================================
  // A
  // ==========================================
  {
    company: 'Audi',
    country: 'Germany',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'A4', type: 'Sedan', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic', 'Dual-Clutch'] },
      { model: 'A6', type: 'Sedan', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic', 'Dual-Clutch'] },
      { model: 'Q3', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic', 'Dual-Clutch'] },
      { model: 'Q5', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic', 'Dual-Clutch'] },
      { model: 'Q7', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'Q8 e-tron', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 114, defaultRange: 582 },
      { model: 'e-tron GT', type: 'Sports Cars', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 93, defaultRange: 488 }
    ]
  },
  {
    company: 'Acura',
    country: 'Japan',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'Integra', type: 'Hatchback', fuel: ['Petrol'], transmissions: ['Manual', 'CVT'] },
      { model: 'TLX', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'RDX', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'MDX', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'ZDX', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 102, defaultRange: 504 }
    ]
  },
  {
    company: 'Aston Martin',
    country: 'United Kingdom',
    category: 'Sports Cars',
    vehicles: [
      { model: 'Vantage', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Automatic', 'Manual'] },
      { model: 'DB11', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'DB12', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'DBS Superleggera', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'DBX', type: 'Luxury Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Valkyrie', type: 'Sports Cars', fuel: ['Hybrid'], transmissions: ['Dual-Clutch'] }
    ]
  },
  {
    company: 'Alfa Romeo',
    country: 'Italy',
    category: 'Cars',
    vehicles: [
      { model: 'Giulia', type: 'Sedan', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Stelvio', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Tonale', type: 'Hybrid Vehicles', fuel: ['Hybrid', 'Petrol'], transmissions: ['Automatic', 'Dual-Clutch'] },
      { model: 'Junior', type: 'Electric Vehicles (EV)', fuel: ['Electric', 'Hybrid'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 54, defaultRange: 410 }
    ]
  },
  {
    company: 'Ashok Leyland',
    country: 'India',
    category: 'Commercial Vehicles',
    vehicles: [
      { model: 'Dost+', type: 'Commercial Vehicles', fuel: ['Diesel', 'CNG'], transmissions: ['Manual'] },
      { model: 'Bada Dost', type: 'Commercial Vehicles', fuel: ['Diesel', 'CNG'], transmissions: ['Manual'] },
      { model: 'Partner', type: 'Trucks', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Ecomet', type: 'Trucks', fuel: ['Diesel', 'CNG'], transmissions: ['Manual'] },
      { model: 'AVTR 3520', type: 'Heavy Machinery', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Oyster Bus', type: 'Buses', fuel: ['Diesel', 'CNG'], transmissions: ['Manual'] },
      { model: 'Switch EiV 12', type: 'Buses', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 300, defaultRange: 250 }
    ]
  },

  // ==========================================
  // B
  // ==========================================
  {
    company: 'BMW',
    country: 'Germany',
    category: 'Luxury Cars',
    vehicles: [
      { model: '3 Series', type: 'Sedan', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: '5 Series', type: 'Sedan', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: '7 Series', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'X1', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Dual-Clutch'] },
      { model: 'X3', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'X5', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'X7', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'i4', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 83.9, defaultRange: 590 },
      { model: 'iX', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 111.5, defaultRange: 630 },
      { model: 'M4 Competition', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'Bentley',
    country: 'United Kingdom',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'Continental GT', type: 'Luxury Cars', fuel: ['Petrol', 'Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'Flying Spur', type: 'Luxury Cars', fuel: ['Petrol', 'Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'Bentayga', type: 'Luxury Cars', fuel: ['Petrol', 'Hybrid'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'Bugatti',
    country: 'France',
    category: 'Sports Cars',
    vehicles: [
      { model: 'Chiron', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Divo', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Tourbillon', type: 'Sports Cars', fuel: ['Hybrid'], transmissions: ['Dual-Clutch'] }
    ]
  },
  {
    company: 'Buick',
    country: 'United States',
    category: 'Cars',
    vehicles: [
      { model: 'Encore GX', type: 'SUV', fuel: ['Petrol'], transmissions: ['CVT', 'Automatic'] },
      { model: 'Envision', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Enclave', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Envista', type: 'Cars', fuel: ['Petrol'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'BYD',
    country: 'China',
    category: 'Electric Vehicles (EV)',
    vehicles: [
      { model: 'Atto 3', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 60.48, defaultRange: 521 },
      { model: 'Seal', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 82.5, defaultRange: 650 },
      { model: 'Dolphin', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 44.9, defaultRange: 427 },
      { model: 'Han EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 85.4, defaultRange: 605 },
      { model: 'Tang EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 108.8, defaultRange: 530 },
      { model: 'Seagull', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 38.8, defaultRange: 405 }
    ]
  },

  // ==========================================
  // C
  // ==========================================
  {
    company: 'Chevrolet',
    country: 'United States',
    category: 'Cars',
    vehicles: [
      { model: 'Cruze', type: 'Sedan', fuel: ['Petrol', 'Diesel'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Malibu', type: 'Sedan', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'Trax', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Equinox', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Tahoe', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Suburban', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Silverado 1500', type: 'Pickup Trucks', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Silverado EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 200, defaultRange: 724 },
      { model: 'Corvette Stingray', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Camaro', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] }
    ]
  },
  {
    company: 'Citroen',
    country: 'France',
    category: 'Cars',
    vehicles: [
      { model: 'C3', type: 'Hatchback', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'C3 Aircross', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'C5 Aircross', type: 'SUV', fuel: ['Diesel', 'Petrol'], transmissions: ['Automatic'] },
      { model: 'e-C3', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 29.2, defaultRange: 320 },
      { model: 'Berlingo', type: 'Vans', fuel: ['Diesel', 'Electric'], transmissions: ['Manual', 'Automatic'] }
    ]
  },
  {
    company: 'Chrysler',
    country: 'United States',
    category: 'Cars',
    vehicles: [
      { model: '300', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Pacifica', type: 'Vans', fuel: ['Petrol', 'Hybrid'], transmissions: ['Automatic', 'CVT'] },
      { model: 'Voyager', type: 'Vans', fuel: ['Petrol'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'Cadillac',
    country: 'United States',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'CT4', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'CT5', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'XT4', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'XT5', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Escalade', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Lyriq', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 102, defaultRange: 505 },
      { model: 'Celestiq', type: 'Luxury Cars', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 111, defaultRange: 483 }
    ]
  },
  {
    company: 'Caterpillar',
    country: 'United States',
    category: 'Heavy Machinery',
    vehicles: [
      { model: 'Cat 320 Excavator', type: 'Heavy Machinery', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'Cat D6 Dozer', type: 'Construction Vehicles', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'Cat 950 Wheel Loader', type: 'Construction Vehicles', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'Cat 745 Articulated Truck', type: 'Heavy Machinery', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'Cat 428 Backhoe Loader', type: 'Construction Vehicles', fuel: ['Diesel'], transmissions: ['Manual'] }
    ]
  },

  // ==========================================
  // D
  // ==========================================
  {
    company: 'Dodge',
    country: 'United States',
    category: 'Sports Cars',
    vehicles: [
      { model: 'Charger', type: 'Sedan', fuel: ['Petrol', 'Electric'], transmissions: ['Automatic', 'Single-Speed'] },
      { model: 'Challenger', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Durango', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Hornet', type: 'Hybrid Vehicles', fuel: ['Petrol', 'Hybrid'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'Daihatsu',
    country: 'Japan',
    category: 'Cars',
    vehicles: [
      { model: 'Tanto', type: 'Hatchback', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'Rocky', type: 'SUV', fuel: ['Petrol', 'Hybrid'], transmissions: ['CVT', 'Manual'] },
      { model: 'Hijet', type: 'Vans', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Copen', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'CVT'] }
    ]
  },
  {
    company: 'Ducati',
    country: 'Italy',
    category: 'Motorcycles',
    vehicles: [
      { model: 'Panigale V4', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Monster Plus', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Multistrada V4', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Diavel V4', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Scrambler Icon', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Hypermotard 698', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] }
    ]
  },
  {
    company: 'Daewoo',
    country: 'South Korea',
    category: 'Cars',
    vehicles: [
      { model: 'Matiz', type: 'Hatchback', fuel: ['Petrol', 'LPG'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Cielo', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Lanos', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Novus Heavy Truck', type: 'Trucks', fuel: ['Diesel'], transmissions: ['Manual'] }
    ]
  },

  // ==========================================
  // E
  // ==========================================
  {
    company: 'Eagle',
    country: 'United States',
    category: 'Cars',
    vehicles: [
      { model: 'Talon TSi', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Vision', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Summit', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] }
    ]
  },
  {
    company: 'Exeed',
    country: 'China',
    category: 'SUVs',
    vehicles: [
      { model: 'RX', type: 'SUV', fuel: ['Petrol', 'Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'VX', type: 'SUV', fuel: ['Petrol'], transmissions: ['Dual-Clutch', 'Automatic'] },
      { model: 'TXL', type: 'SUV', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Sterra ES', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 82, defaultRange: 605 }
    ]
  },

  // ==========================================
  // F
  // ==========================================
  {
    company: 'Ford',
    country: 'United States',
    category: 'Cars',
    vehicles: [
      { model: 'Mustang GT', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Mustang Mach-E', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 91, defaultRange: 500 },
      { model: 'F-150 Lightning', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 131, defaultRange: 515 },
      { model: 'F-150 SuperDuty', type: 'Pickup Trucks', fuel: ['Diesel', 'Petrol'], transmissions: ['Automatic'] },
      { model: 'Ranger Raptor', type: 'Pickup Trucks', fuel: ['Diesel', 'Petrol'], transmissions: ['Automatic'] },
      { model: 'Explorer', type: 'SUV', fuel: ['Petrol', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'Bronco', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Endeavour (Everest)', type: 'SUV', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'Transit Custom', type: 'Vans', fuel: ['Diesel', 'Electric'], transmissions: ['Manual', 'Automatic'] },
      { model: 'E-Transit', type: 'Commercial Vehicles', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 68, defaultRange: 317 }
    ]
  },
  {
    company: 'Ferrari',
    country: 'Italy',
    category: 'Sports Cars',
    vehicles: [
      { model: '296 GTB', type: 'Sports Cars', fuel: ['Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'SF90 Stradale', type: 'Sports Cars', fuel: ['Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'Roma', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Purosangue', type: 'Luxury Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: '12Cilindri', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] }
    ]
  },
  {
    company: 'Fiat',
    country: 'Italy',
    category: 'Cars',
    vehicles: [
      { model: '500', type: 'Hatchback', fuel: ['Petrol', 'Hybrid'], transmissions: ['Manual', 'Automatic'] },
      { model: '500e', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 42, defaultRange: 320 },
      { model: 'Panda', type: 'Hatchback', fuel: ['Petrol', 'Hybrid'], transmissions: ['Manual'] },
      { model: 'Tipo', type: 'Sedan', fuel: ['Diesel', 'Petrol', 'Hybrid'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Ducato', type: 'Vans', fuel: ['Diesel', 'Electric'], transmissions: ['Manual', 'Automatic'] }
    ]
  },
  {
    company: 'Force Motors',
    country: 'India',
    category: 'Commercial Vehicles',
    vehicles: [
      { model: 'Gurkha 4x4', type: 'SUV', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Traveller 3050', type: 'Vans', fuel: ['Diesel', 'CNG'], transmissions: ['Manual'] },
      { model: 'Traveller Monobus', type: 'Buses', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Trax Cruiser', type: 'Commercial Vehicles', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Urbania', type: 'Vans', fuel: ['Diesel'], transmissions: ['Manual'] }
    ]
  },

  // ==========================================
  // G
  // ==========================================
  {
    company: 'GMC',
    country: 'United States',
    category: 'Trucks',
    vehicles: [
      { model: 'Sierra 1500', type: 'Pickup Trucks', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Yukon Denali', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Hummer EV Pickup', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 212, defaultRange: 560 },
      { model: 'Hummer EV SUV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 170, defaultRange: 505 },
      { model: 'Canyon', type: 'Pickup Trucks', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Savanah Cargo Van', type: 'Commercial Vehicles', fuel: ['Petrol'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'Genesis',
    country: 'South Korea',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'G70', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'G80', type: 'Sedan', fuel: ['Petrol', 'Electric'], transmissions: ['Automatic', 'Single-Speed'] },
      { model: 'G90', type: 'Luxury Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'GV70', type: 'SUV', fuel: ['Petrol', 'Electric'], transmissions: ['Automatic', 'Single-Speed'] },
      { model: 'GV80', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'GV60', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 77.4, defaultRange: 451 }
    ]
  },
  {
    company: 'Geely',
    country: 'China',
    category: 'Cars',
    vehicles: [
      { model: 'Monjaro', type: 'SUV', fuel: ['Petrol', 'Hybrid'], transmissions: ['Automatic', 'Dual-Clutch'] },
      { model: 'Coolray', type: 'SUV', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Emgrand', type: 'Sedan', fuel: ['Petrol'], transmissions: ['CVT', 'Manual'] },
      { model: 'Geometry C', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 70, defaultRange: 460 },
      { model: 'Galaxy L7', type: 'Hybrid Vehicles', fuel: ['Hybrid'], transmissions: ['Dual-Clutch'] }
    ]
  },

  // ==========================================
  // H
  // ==========================================
  {
    company: 'Honda',
    country: 'Japan',
    category: 'Cars',
    vehicles: [
      { model: 'City', type: 'Sedan', fuel: ['Petrol', 'Hybrid'], transmissions: ['Manual', 'CVT'] },
      { model: 'Civic Type R', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Accord Hybrid', type: 'Sedan', fuel: ['Hybrid'], transmissions: ['CVT'] },
      { model: 'Elevate', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'CVT'] },
      { model: 'CR-V', type: 'SUV', fuel: ['Petrol', 'Hybrid'], transmissions: ['CVT'] },
      { model: 'Pilot', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'CBR1000RR-R Fireblade', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Africa Twin', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Activa 6G', type: 'Scooters', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'Prologue EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 85, defaultRange: 480 }
    ]
  },
  {
    company: 'Hyundai',
    country: 'South Korea',
    category: 'Cars',
    vehicles: [
      { model: 'i20 N Line', type: 'Hatchback', fuel: ['Petrol'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Verna', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Manual', 'CVT', 'Dual-Clutch'] },
      { model: 'Creta', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Manual', 'Automatic', 'CVT', 'Dual-Clutch'] },
      { model: 'Alcazar', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Manual', 'Automatic', 'Dual-Clutch'] },
      { model: 'Tucson', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'Palisade', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Ioniq 5', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 72.6, defaultRange: 631 },
      { model: 'Ioniq 6', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 77.4, defaultRange: 614 },
      { model: 'Staria Van', type: 'Vans', fuel: ['Diesel', 'LPG'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'Hero',
    country: 'India',
    category: 'Motorcycles',
    vehicles: [
      { model: 'Splendor Plus', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'HF Deluxe', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Passion Xtec', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Glamour Xtec', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Xpulse 200 4V', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Karizma XMR', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Vida V1 Pro', type: 'Scooters', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 3.94, defaultRange: 165 },
      { model: 'Destini 125', type: 'Scooters', fuel: ['Petrol'], transmissions: ['CVT'] }
    ]
  },
  {
    company: 'Harley Davidson',
    country: 'United States',
    category: 'Motorcycles',
    vehicles: [
      { model: 'Iron 883', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Fat Boy 114', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Street Bob 114', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Road Glide Special', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Pan America 1250', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'LiveWire ONE', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 15.4, defaultRange: 235 },
      { model: 'X440', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] }
    ]
  },

  // ==========================================
  // I
  // ==========================================
  {
    company: 'Isuzu',
    country: 'Japan',
    category: 'Commercial Vehicles',
    vehicles: [
      { model: 'D-Max V-Cross', type: 'Pickup Trucks', fuel: ['Diesel'], transmissions: ['Manual', 'Automatic'] },
      { model: 'MU-X', type: 'SUV', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'NPR HD Truck', type: 'Trucks', fuel: ['Diesel'], transmissions: ['Automatic', 'Manual'] },
      { model: 'FTR Heavy Truck', type: 'Trucks', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'S-CAB Commercial', type: 'Commercial Vehicles', fuel: ['Diesel'], transmissions: ['Manual'] }
    ]
  },
  {
    company: 'Infiniti',
    country: 'Japan',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'Q50', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'QX50', type: 'SUV', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'QX60', type: 'Luxury Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'QX80', type: 'Luxury Cars', fuel: ['Petrol'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'Iveco',
    country: 'Italy',
    category: 'Trucks',
    vehicles: [
      { model: 'Daily Van', type: 'Vans', fuel: ['Diesel', 'CNG', 'Electric'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Eurocargo', type: 'Trucks', fuel: ['Diesel', 'CNG'], transmissions: ['Manual', 'Automatic'] },
      { model: 'S-Way Heavy Hauler', type: 'Heavy Machinery', fuel: ['Diesel', 'Hydrogen'], transmissions: ['Automatic'] },
      { model: 'Crossway Bus', type: 'Buses', fuel: ['Diesel', 'CNG'], transmissions: ['Automatic'] }
    ]
  },

  // ==========================================
  // J
  // ==========================================
  {
    company: 'Jeep',
    country: 'United States',
    category: 'SUVs',
    vehicles: [
      { model: 'Wrangler Rubicon', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'Grand Cherokee', type: 'Luxury Cars', fuel: ['Petrol', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'Compass', type: 'SUV', fuel: ['Diesel', 'Petrol'], transmissions: ['Manual', 'Automatic', 'Dual-Clutch'] },
      { model: 'Meridian', type: 'SUV', fuel: ['Diesel'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Gladiator', type: 'Pickup Trucks', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Avenger EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 54, defaultRange: 400 },
      { model: 'Wagoneer S', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 100, defaultRange: 480 }
    ]
  },
  {
    company: 'Jaguar',
    country: 'United Kingdom',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'F-PACE', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'E-PACE', type: 'SUV', fuel: ['Petrol', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'I-PACE', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 90, defaultRange: 470 },
      { model: 'XF', type: 'Sedan', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'F-TYPE', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'JCB',
    country: 'United Kingdom',
    category: 'Construction Vehicles',
    vehicles: [
      { model: '3DX Super EcoXcellence', type: 'Construction Vehicles', fuel: ['Diesel'], transmissions: ['Manual', 'Automatic'] },
      { model: '4DX Backhoe Loader', type: 'Construction Vehicles', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'JCB 220X Excavator', type: 'Heavy Machinery', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'Fastrac 4220 Tractor', type: 'Agricultural Vehicles', fuel: ['Diesel'], transmissions: ['CVT'] },
      { model: 'JCB 540-140 Telehandler', type: 'Heavy Machinery', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'JCB 19C-1E Electric Mini', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 20, defaultRange: 150 }
    ]
  },

  // ==========================================
  // K
  // ==========================================
  {
    company: 'Kia',
    country: 'South Korea',
    category: 'Cars',
    vehicles: [
      { model: 'Seltos', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Manual', 'Automatic', 'CVT', 'Dual-Clutch'] },
      { model: 'Sonet', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Manual', 'Automatic', 'Dual-Clutch'] },
      { model: 'Carens', type: 'Vans', fuel: ['Petrol', 'Diesel'], transmissions: ['Manual', 'Automatic', 'Dual-Clutch'] },
      { model: 'Carnival Limousine', type: 'Vans', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'EV6', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 77.4, defaultRange: 708 },
      { model: 'EV9', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 99.8, defaultRange: 541 },
      { model: 'Sportage', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'Telluride', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'KTM',
    country: 'Austria',
    category: 'Motorcycles',
    vehicles: [
      { model: 'Duke 390', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Duke 250', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'RC 390', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: '390 Adventure', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: '1290 Super Duke R', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: '890 Adventure R', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Freeride E-XC', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 3.9, defaultRange: 90 }
    ]
  },
  {
    company: 'Kawasaki',
    country: 'Japan',
    category: 'Motorcycles',
    vehicles: [
      { model: 'Ninja ZX-10R', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Ninja ZX-6R', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Ninja 400 / 500', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Z900', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Versys 650', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Ninja H2 Carbon', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Ninja 7 Hybrid', type: 'Hybrid Vehicles', fuel: ['Hybrid'], transmissions: ['Automatic', 'Manual'] },
      { model: 'Ninja e-1', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 3.0, defaultRange: 72 }
    ]
  },

  // ==========================================
  // L
  // ==========================================
  {
    company: 'Lamborghini',
    country: 'Italy',
    category: 'Sports Cars',
    vehicles: [
      { model: 'Revuelto', type: 'Sports Cars', fuel: ['Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'Huracan Tecnica', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Urus Performante', type: 'Luxury Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Urus SE Hybrid', type: 'Hybrid Vehicles', fuel: ['Hybrid'], transmissions: ['Automatic'] },
      { model: 'Temerario', type: 'Sports Cars', fuel: ['Hybrid'], transmissions: ['Dual-Clutch'] }
    ]
  },
  {
    company: 'Land Rover',
    country: 'United Kingdom',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'Range Rover SV', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'Range Rover Sport', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'Range Rover Velar', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Defender 110', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'Defender 130', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Discovery', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Range Rover Electric', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 105, defaultRange: 500 }
    ]
  },
  {
    company: 'Lexus',
    country: 'Japan',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'ES 300h', type: 'Sedan', fuel: ['Hybrid'], transmissions: ['CVT'] },
      { model: 'LS 500h', type: 'Luxury Cars', fuel: ['Hybrid'], transmissions: ['CVT', 'Automatic'] },
      { model: 'NX 350h', type: 'SUV', fuel: ['Hybrid'], transmissions: ['CVT'] },
      { model: 'RX 500h F Sport', type: 'Luxury Cars', fuel: ['Hybrid'], transmissions: ['Automatic'] },
      { model: 'LX 600', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'RZ 450e', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 71.4, defaultRange: 450 },
      { model: 'LC 500', type: 'Sports Cars', fuel: ['Petrol', 'Hybrid'], transmissions: ['Automatic', 'CVT'] }
    ]
  },
  {
    company: 'Lotus',
    country: 'United Kingdom',
    category: 'Sports Cars',
    vehicles: [
      { model: 'Emira', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic', 'Dual-Clutch'] },
      { model: 'Eletre Hyper-SUV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 112, defaultRange: 600 },
      { model: 'Emeya Hyper-GT', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 102, defaultRange: 610 },
      { model: 'Evija', type: 'Sports Cars', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 70, defaultRange: 400 }
    ]
  },

  // ==========================================
  // M
  // ==========================================
  {
    company: 'Mercedes-Benz',
    country: 'Germany',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'C-Class', type: 'Sedan', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'E-Class', type: 'Sedan', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'S-Class Maybach', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'GLA', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Dual-Clutch'] },
      { model: 'GLC', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'GLE', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'GLS', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'G-Class (G63 AMG)', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel', 'Electric'], transmissions: ['Automatic'] },
      { model: 'EQE SUV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 90.6, defaultRange: 550 },
      { model: 'EQS 580', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 108.4, defaultRange: 677 },
      { model: 'Actros Heavy Truck', type: 'Trucks', fuel: ['Diesel', 'Electric'], transmissions: ['Automatic'] },
      { model: 'Sprinter Van', type: 'Vans', fuel: ['Diesel', 'Electric'], transmissions: ['Automatic', 'Manual'] }
    ]
  },
  {
    company: 'Mahindra',
    country: 'India',
    category: 'SUVs',
    vehicles: [
      { model: 'Scorpio-N', type: 'SUV', fuel: ['Diesel', 'Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Scorpio Classic', type: 'SUV', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'XUV700', type: 'SUV', fuel: ['Diesel', 'Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Thar / Thar Roxx', type: 'SUV', fuel: ['Diesel', 'Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'XUV 3XO', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Manual', 'Automatic'] },
      { model: 'XUV400 EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 39.4, defaultRange: 456 },
      { model: 'Bolero Neo', type: 'Commercial Vehicles', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Bolero Maxi Truck', type: 'Commercial Vehicles', fuel: ['Diesel', 'CNG'], transmissions: ['Manual'] },
      { model: 'Supro Profit Truck', type: 'Commercial Vehicles', fuel: ['Diesel', 'CNG'], transmissions: ['Manual'] },
      { model: 'Blazo X Heavy Truck', type: 'Trucks', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: '575 DI Tractor', type: 'Agricultural Vehicles', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Arjun Novo Tractor', type: 'Agricultural Vehicles', fuel: ['Diesel'], transmissions: ['Manual'] }
    ]
  },
  {
    company: 'Maruti Suzuki',
    country: 'India',
    category: 'Cars',
    vehicles: [
      { model: 'Swift', type: 'Hatchback', fuel: ['Petrol', 'CNG'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Baleno', type: 'Hatchback', fuel: ['Petrol', 'CNG'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Dzire', type: 'Sedan', fuel: ['Petrol', 'CNG'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Brezza', type: 'SUV', fuel: ['Petrol', 'CNG'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Grand Vitara Hybrid', type: 'Hybrid Vehicles', fuel: ['Hybrid', 'Petrol', 'CNG'], transmissions: ['Manual', 'Automatic', 'CVT'] },
      { model: 'Fronx', type: 'Cars', fuel: ['Petrol', 'CNG'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Jimny 4x4', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Ertiga', type: 'Vans', fuel: ['Petrol', 'CNG'], transmissions: ['Manual', 'Automatic'] },
      { model: 'XL6', type: 'Vans', fuel: ['Petrol', 'CNG'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Invicto', type: 'Hybrid Vehicles', fuel: ['Hybrid'], transmissions: ['CVT'] },
      { model: 'Super Carry', type: 'Commercial Vehicles', fuel: ['Petrol', 'CNG'], transmissions: ['Manual'] },
      { model: 'eVX Concept EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 60, defaultRange: 550 }
    ]
  },
  {
    company: 'Mazda',
    country: 'Japan',
    category: 'Cars',
    vehicles: [
      { model: 'Mazda3', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Mazda6', type: 'Sedan', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'CX-30', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'CX-5', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'CX-90', type: 'SUV', fuel: ['Hybrid', 'Petrol'], transmissions: ['Automatic'] },
      { model: 'MX-5 Miata', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'MX-30 EV', type: 'Electric Vehicles (EV)', fuel: ['Electric', 'Hybrid'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 35.5, defaultRange: 200 }
    ]
  },
  {
    company: 'Mitsubishi',
    country: 'Japan',
    category: 'SUVs',
    vehicles: [
      { model: 'Pajero Sport', type: 'SUV', fuel: ['Diesel'], transmissions: ['Automatic', 'Manual'] },
      { model: 'Outlander PHEV', type: 'Hybrid Vehicles', fuel: ['Hybrid'], transmissions: ['CVT'] },
      { model: 'Eclipse Cross', type: 'SUV', fuel: ['Petrol', 'Hybrid'], transmissions: ['CVT'] },
      { model: 'Triton / L200', type: 'Pickup Trucks', fuel: ['Diesel'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Xpander Cross', type: 'Vans', fuel: ['Petrol'], transmissions: ['Manual', 'CVT'] },
      { model: 'Fuso Canter Truck', type: 'Commercial Vehicles', fuel: ['Diesel', 'Electric'], transmissions: ['Manual', 'Automatic'] }
    ]
  },
  {
    company: 'MG Motors',
    country: 'United Kingdom',
    category: 'Cars',
    vehicles: [
      { model: 'Hector / Hector Plus', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Manual', 'CVT'] },
      { model: 'Astor', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic', 'CVT'] },
      { model: 'ZS EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 50.3, defaultRange: 461 },
      { model: 'Comet EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 17.3, defaultRange: 230 },
      { model: 'Gloster 4x4', type: 'Luxury Cars', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'Cyberster Roadster', type: 'Sports Cars', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 77, defaultRange: 520 },
      { model: 'MG4 EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 64, defaultRange: 450 }
    ]
  },

  // ==========================================
  // N
  // ==========================================
  {
    company: 'Nissan',
    country: 'Japan',
    category: 'Cars',
    vehicles: [
      { model: 'Magnite', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'CVT', 'Automatic'] },
      { model: 'X-Trail e-POWER', type: 'Hybrid Vehicles', fuel: ['Hybrid'], transmissions: ['CVT'] },
      { model: 'Kicks', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'CVT'] },
      { model: 'Altima', type: 'Sedan', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'Patrol Y63', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Navara (Frontier)', type: 'Pickup Trucks', fuel: ['Diesel', 'Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Ariya', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 87, defaultRange: 500 },
      { model: 'Leaf', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 40, defaultRange: 270 },
      { model: 'GT-R Nismo', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] }
    ]
  },
  {
    company: 'Navistar',
    country: 'United States',
    category: 'Trucks',
    vehicles: [
      { model: 'International LT Series', type: 'Heavy Machinery', fuel: ['Diesel'], transmissions: ['Automatic', 'Manual'] },
      { model: 'International RH Regional', type: 'Trucks', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'International MV Medium Truck', type: 'Trucks', fuel: ['Diesel', 'Electric'], transmissions: ['Automatic'] },
      { model: 'IC Bus CE Series School Bus', type: 'Buses', fuel: ['Diesel', 'Electric', 'CNG'], transmissions: ['Automatic'] }
    ]
  },

  // ==========================================
  // O
  // ==========================================
  {
    company: 'Opel',
    country: 'Germany',
    category: 'Cars',
    vehicles: [
      { model: 'Corsa', type: 'Hatchback', fuel: ['Petrol', 'Electric', 'Hybrid'], transmissions: ['Manual', 'Automatic', 'Single-Speed'] },
      { model: 'Astra', type: 'Hatchback', fuel: ['Petrol', 'Diesel', 'Hybrid', 'Electric'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Mokka', type: 'SUV', fuel: ['Petrol', 'Electric'], transmissions: ['Manual', 'Automatic', 'Single-Speed'] },
      { model: 'Grandland', type: 'SUV', fuel: ['Hybrid', 'Electric', 'Petrol'], transmissions: ['Automatic'] },
      { model: 'Movano Van', type: 'Vans', fuel: ['Diesel', 'Electric'], transmissions: ['Manual', 'Automatic'] }
    ]
  },
  {
    company: 'Oldsmobile',
    country: 'United States',
    category: 'Cars',
    vehicles: [
      { model: 'Cutlass Supreme', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: '442 Muscle Car', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Aurora', type: 'Luxury Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Bravada', type: 'SUV', fuel: ['Petrol'], transmissions: ['Automatic'] }
    ]
  },

  // ==========================================
  // P
  // ==========================================
  {
    company: 'Porsche',
    country: 'Germany',
    category: 'Sports Cars',
    vehicles: [
      { model: '911 Carrera / Turbo S', type: 'Sports Cars', fuel: ['Petrol', 'Hybrid'], transmissions: ['Dual-Clutch', 'Manual'] },
      { model: '718 Cayman / Boxster', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Taycan', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 105, defaultRange: 678 },
      { model: 'Panamera', type: 'Luxury Cars', fuel: ['Petrol', 'Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'Macan EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 100, defaultRange: 613 },
      { model: 'Cayenne Turbo E-Hybrid', type: 'Luxury Cars', fuel: ['Hybrid', 'Petrol'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'Peugeot',
    country: 'France',
    category: 'Cars',
    vehicles: [
      { model: '208 / e-208', type: 'Hatchback', fuel: ['Petrol', 'Electric'], transmissions: ['Manual', 'Automatic', 'Single-Speed'] },
      { model: '308', type: 'Hatchback', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Manual', 'Automatic'] },
      { model: '2008', type: 'SUV', fuel: ['Petrol', 'Electric'], transmissions: ['Automatic', 'Single-Speed'] },
      { model: '3008', type: 'SUV', fuel: ['Hybrid', 'Electric', 'Petrol'], transmissions: ['Automatic', 'Single-Speed'] },
      { model: '5008', type: 'SUV', fuel: ['Hybrid', 'Electric', 'Diesel'], transmissions: ['Automatic'] },
      { model: 'Boxer Van', type: 'Vans', fuel: ['Diesel', 'Electric'], transmissions: ['Manual', 'Automatic'] }
    ]
  },
  {
    company: 'Proton',
    country: 'Malaysia',
    category: 'Cars',
    vehicles: [
      { model: 'Saga', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Persona', type: 'Sedan', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'Iriz', type: 'Hatchback', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'X50', type: 'SUV', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'X70', type: 'SUV', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'X90', type: 'Hybrid Vehicles', fuel: ['Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'e.MAS 7', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 60.2, defaultRange: 440 }
    ]
  },

  // ==========================================
  // Q
  // ==========================================
  {
    company: 'Qoros',
    country: 'China',
    category: 'Cars',
    vehicles: [
      { model: 'Qoros 3 Sedan', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Qoros 5 SUV', type: 'SUV', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Qoros 7 SUV', type: 'SUV', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] }
    ]
  },

  // ==========================================
  // R
  // ==========================================
  {
    company: 'Renault',
    country: 'France',
    category: 'Cars',
    vehicles: [
      { model: 'Kwid', type: 'Hatchback', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Triber', type: 'Vans', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Kiger', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'CVT'] },
      { model: 'Duster', type: 'SUV', fuel: ['Petrol', 'Hybrid', 'Diesel'], transmissions: ['Manual', 'Automatic', 'Dual-Clutch'] },
      { model: 'Megane E-Tech', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 60, defaultRange: 450 },
      { model: 'Master Van', type: 'Commercial Vehicles', fuel: ['Diesel', 'Electric', 'Hydrogen'], transmissions: ['Manual', 'Automatic'] }
    ]
  },
  {
    company: 'Rolls Royce',
    country: 'United Kingdom',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'Phantom VIII', type: 'Luxury Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Ghost', type: 'Luxury Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Cullinan SUV', type: 'Luxury Cars', fuel: ['Petrol'], transmissions: ['Automatic'] },
      { model: 'Spectre EV Coupe', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 102, defaultRange: 530 }
    ]
  },
  {
    company: 'Rivian',
    country: 'United States',
    category: 'Electric Vehicles (EV)',
    vehicles: [
      { model: 'R1T Electric Truck', type: 'Pickup Trucks', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 135, defaultRange: 660 },
      { model: 'R1S Electric SUV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 135, defaultRange: 643 },
      { model: 'R2 Mid-Size SUV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 85, defaultRange: 482 },
      { model: 'R3X Compact Crossover', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 75, defaultRange: 480 },
      { model: 'EDV Commercial Delivery Van', type: 'Commercial Vehicles', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 100, defaultRange: 240 }
    ]
  },

  // ==========================================
  // S
  // ==========================================
  {
    company: 'Suzuki',
    country: 'Japan',
    category: 'Cars',
    vehicles: [
      { model: 'Hayabusa GSX1300R', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'GSX-R1000', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'V-Strom 800DE', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Gixxer SF 250', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Access 125', type: 'Scooters', fuel: ['Petrol', 'Electric'], transmissions: ['CVT'] },
      { model: 'Burgman Street EX', type: 'Scooters', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'Vitara', type: 'SUV', fuel: ['Hybrid', 'Petrol'], transmissions: ['Manual', 'Automatic'] }
    ]
  },
  {
    company: 'Skoda',
    country: 'Czech Republic',
    category: 'Cars',
    vehicles: [
      { model: 'Slavia', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic', 'Dual-Clutch'] },
      { model: 'Kushaq', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic', 'Dual-Clutch'] },
      { model: 'Kylaq', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Superb', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'Kodiaq', type: 'Luxury Cars', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'Octavia RS', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Enyaq iV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 82, defaultRange: 565 }
    ]
  },
  {
    company: 'Subaru',
    country: 'Japan',
    category: 'SUVs',
    vehicles: [
      { model: 'Outback', type: 'SUV', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'Forester', type: 'SUV', fuel: ['Petrol', 'Hybrid'], transmissions: ['CVT'] },
      { model: 'Crosstrek', type: 'SUV', fuel: ['Petrol', 'Hybrid'], transmissions: ['CVT'] },
      { model: 'WRX STi', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'CVT'] },
      { model: 'BRZ', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Solterra EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 71.4, defaultRange: 465 }
    ]
  },
  {
    company: 'Scania',
    country: 'Sweden',
    category: 'Heavy Machinery',
    vehicles: [
      { model: 'R-Series Heavy Truck', type: 'Heavy Machinery', fuel: ['Diesel', 'CNG', 'Electric'], transmissions: ['Automatic'] },
      { model: 'S-Series Long Haul', type: 'Trucks', fuel: ['Diesel', 'Hydrogen'], transmissions: ['Automatic'] },
      { model: 'G-Series Construction Tipper', type: 'Construction Vehicles', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'Touring Coach Bus', type: 'Buses', fuel: ['Diesel', 'Electric'], transmissions: ['Automatic'] },
      { model: 'Citywide Electric Bus', type: 'Buses', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 330, defaultRange: 300 }
    ]
  },
  {
    company: 'Seat',
    country: 'Spain',
    category: 'Cars',
    vehicles: [
      { model: 'Ibiza', type: 'Hatchback', fuel: ['Petrol', 'CNG'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Leon', type: 'Hatchback', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Arona', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Ateca', type: 'SUV', fuel: ['Petrol', 'Diesel'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Tarraco', type: 'SUV', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Dual-Clutch'] }
    ]
  },
  {
    company: 'Smart',
    country: 'Germany',
    category: 'Electric Vehicles (EV)',
    vehicles: [
      { model: '#1 Compact EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 66, defaultRange: 440 },
      { model: '#3 Coupe SUV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 66, defaultRange: 455 },
      { model: '#5 Premium SUV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 100, defaultRange: 740 },
      { model: 'Fortwo EQ', type: 'Hatchback', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 17.6, defaultRange: 160 }
    ]
  },

  // ==========================================
  // T
  // ==========================================
  {
    company: 'Toyota',
    country: 'Japan',
    category: 'Cars',
    vehicles: [
      { model: 'Corolla', type: 'Sedan', fuel: ['Petrol', 'Hybrid'], transmissions: ['Manual', 'CVT'] },
      { model: 'Camry', type: 'Sedan', fuel: ['Hybrid', 'Petrol'], transmissions: ['CVT', 'Automatic'] },
      { model: 'Fortuner', type: 'SUV', fuel: ['Diesel', 'Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Fortuner Legender', type: 'SUV', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'Innova Crysta', type: 'Vans', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Innova HyCross', type: 'Hybrid Vehicles', fuel: ['Hybrid', 'Petrol'], transmissions: ['CVT'] },
      { model: 'Hilux 4x4', type: 'Pickup Trucks', fuel: ['Diesel'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Land Cruiser LC300', type: 'Luxury Cars', fuel: ['Diesel', 'Petrol'], transmissions: ['Automatic'] },
      { model: 'Land Cruiser Prado', type: 'SUV', fuel: ['Diesel', 'Hybrid'], transmissions: ['Automatic'] },
      { model: 'Urban Cruiser Taisor', type: 'SUV', fuel: ['Petrol', 'CNG'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Urban Cruiser Hyryder', type: 'Hybrid Vehicles', fuel: ['Hybrid', 'Petrol', 'CNG'], transmissions: ['Manual', 'Automatic', 'CVT'] },
      { model: 'Vellfire Luxury Lounge', type: 'Luxury Cars', fuel: ['Hybrid'], transmissions: ['CVT'] },
      { model: 'RAV4 Prime', type: 'Hybrid Vehicles', fuel: ['Hybrid'], transmissions: ['CVT'] },
      { model: 'bZ4X', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 71.4, defaultRange: 516 },
      { model: 'GR Supra', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Mirai FCEV', type: 'Sedan', fuel: ['Hydrogen'], transmissions: ['Single-Speed'], defaultRange: 650 }
    ]
  },
  {
    company: 'Tesla',
    country: 'United States',
    category: 'Electric Vehicles (EV)',
    vehicles: [
      { model: 'Model S Plaid', type: 'Sports Cars', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 100, defaultRange: 600 },
      { model: 'Model 3 Long Range', type: 'Sedan', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 78.1, defaultRange: 629 },
      { model: 'Model X Plaid', type: 'Luxury Cars', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 100, defaultRange: 543 },
      { model: 'Model Y Dual Motor', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 78.1, defaultRange: 533 },
      { model: 'Cybertruck Cyberbeast', type: 'Pickup Trucks', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 123, defaultRange: 547 },
      { model: 'Tesla Semi Commercial', type: 'Trucks', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 850, defaultRange: 800 },
      { model: 'Roadster 2.0', type: 'Sports Cars', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 200, defaultRange: 1000 }
    ]
  },
  {
    company: 'Tata Motors',
    country: 'India',
    category: 'Cars',
    vehicles: [
      { model: 'Nexon', type: 'SUV', fuel: ['Petrol', 'Diesel', 'CNG'], transmissions: ['Manual', 'Automatic', 'Dual-Clutch'] },
      { model: 'Nexon.ev', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 45, defaultRange: 489 },
      { model: 'Harrier', type: 'SUV', fuel: ['Diesel'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Safari', type: 'SUV', fuel: ['Diesel'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Curvv / Curvv.ev', type: 'SUV', fuel: ['Electric', 'Petrol', 'Diesel'], transmissions: ['Single-Speed', 'Manual', 'Dual-Clutch'], defaultBatteryCapacity: 55, defaultRange: 585 },
      { model: 'Punch / Punch.ev', type: 'SUV', fuel: ['Petrol', 'CNG', 'Electric'], transmissions: ['Manual', 'Automatic', 'Single-Speed'], defaultBatteryCapacity: 35, defaultRange: 421 },
      { model: 'Tiago / Tiago.ev', type: 'Hatchback', fuel: ['Petrol', 'CNG', 'Electric'], transmissions: ['Manual', 'Automatic', 'Single-Speed'], defaultBatteryCapacity: 24, defaultRange: 315 },
      { model: 'Tigor / Tigor.ev', type: 'Sedan', fuel: ['Petrol', 'CNG', 'Electric'], transmissions: ['Manual', 'Automatic', 'Single-Speed'], defaultBatteryCapacity: 26, defaultRange: 315 },
      { model: 'Ace Gold (Chota Hathi)', type: 'Commercial Vehicles', fuel: ['Diesel', 'Petrol', 'CNG', 'Electric'], transmissions: ['Manual'] },
      { model: 'Yodha 2.0 Pickup', type: 'Pickup Trucks', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Signa 4825 Heavy Tipper', type: 'Trucks', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Prima 5530 Heavy Hauler', type: 'Heavy Machinery', fuel: ['Diesel', 'Hydrogen'], transmissions: ['Manual', 'Automatic'] },
      { model: 'Starbus Urban Electric', type: 'Buses', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 250, defaultRange: 200 }
    ]
  },
  {
    company: 'Triumph',
    country: 'United Kingdom',
    category: 'Motorcycles',
    vehicles: [
      { model: 'Speed 400', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Scrambler 400X', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Street Triple 765 RS', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Tiger 900 Rally Pro', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Tiger 1200 GT Explorer', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Bonneville T120', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Rocket 3 R (2500cc)', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Daytona 660', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] }
    ]
  },

  // ==========================================
  // U
  // ==========================================
  {
    company: 'UD Trucks',
    country: 'Japan',
    category: 'Trucks',
    vehicles: [
      { model: 'Quon Heavy Duty', type: 'Heavy Machinery', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: 'Croner Medium Duty', type: 'Trucks', fuel: ['Diesel'], transmissions: ['Automatic', 'Manual'] },
      { model: 'Kuzer Light Duty', type: 'Commercial Vehicles', fuel: ['Diesel'], transmissions: ['Manual'] },
      { model: 'Quester Construction Tipper', type: 'Construction Vehicles', fuel: ['Diesel'], transmissions: ['Manual'] }
    ]
  },

  // ==========================================
  // V
  // ==========================================
  {
    company: 'Volkswagen',
    country: 'Germany',
    category: 'Cars',
    vehicles: [
      { model: 'Virtus GT', type: 'Sedan', fuel: ['Petrol'], transmissions: ['Manual', 'Dual-Clutch', 'Automatic'] },
      { model: 'Taigun GT', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'Dual-Clutch', 'Automatic'] },
      { model: 'Tiguan', type: 'SUV', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Golf GTI / R', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Passat', type: 'Sedan', fuel: ['Petrol', 'Diesel', 'Hybrid'], transmissions: ['Dual-Clutch'] },
      { model: 'Touareg R', type: 'Luxury Cars', fuel: ['Hybrid', 'Diesel', 'Petrol'], transmissions: ['Automatic'] },
      { model: 'ID.4', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 82, defaultRange: 520 },
      { model: 'ID.Buzz Microbus', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 82, defaultRange: 423 },
      { model: 'ID.7 Luxury Sedan', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 86, defaultRange: 700 },
      { model: 'Crafter Commercial Van', type: 'Vans', fuel: ['Diesel', 'Electric'], transmissions: ['Manual', 'Automatic'] }
    ]
  },
  {
    company: 'Volvo',
    country: 'Sweden',
    category: 'Luxury Cars',
    vehicles: [
      { model: 'XC40 Recharge (EX40)', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 78, defaultRange: 475 },
      { model: 'C40 Recharge (EC40)', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 78, defaultRange: 530 },
      { model: 'EX30 Compact SUV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 69, defaultRange: 476 },
      { model: 'EX90 Flagship EV', type: 'Luxury Cars', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 111, defaultRange: 600 },
      { model: 'XC60 B5 Mild-Hybrid', type: 'SUV', fuel: ['Hybrid', 'Petrol'], transmissions: ['Automatic'] },
      { model: 'XC90 B6', type: 'Luxury Cars', fuel: ['Hybrid', 'Petrol'], transmissions: ['Automatic'] },
      { model: 'S90 Sedan', type: 'Sedan', fuel: ['Hybrid', 'Petrol'], transmissions: ['Automatic'] },
      { model: 'FH16 750 Heavy Truck', type: 'Heavy Machinery', fuel: ['Diesel', 'Electric', 'Hydrogen'], transmissions: ['Automatic'] },
      { model: '9700 Luxury Coach Bus', type: 'Buses', fuel: ['Diesel', 'Electric'], transmissions: ['Automatic'] },
      { model: 'FMX Construction Tipper', type: 'Construction Vehicles', fuel: ['Diesel'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'Vespa',
    country: 'Italy',
    category: 'Scooters',
    vehicles: [
      { model: 'Primavera 150', type: 'Scooters', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'Sprint S 150', type: 'Scooters', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'GTS 300 Super', type: 'Scooters', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'Elettrica 70 km/h', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 4.2, defaultRange: 100 },
      { model: 'VXL 125', type: 'Scooters', fuel: ['Petrol'], transmissions: ['CVT'] }
    ]
  },

  // ==========================================
  // W
  // ==========================================
  {
    company: 'W Motors',
    country: 'United Arab Emirates',
    category: 'Sports Cars',
    vehicles: [
      { model: 'Lykan HyperSport', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Fenyr SuperSport', type: 'Sports Cars', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'Ghiath Smart Patrol', type: 'Emergency Vehicles', fuel: ['Petrol'], transmissions: ['Automatic'] }
    ]
  },
  {
    company: 'Western Star',
    country: 'United States',
    category: 'Heavy Machinery',
    vehicles: [
      { model: '49X Extreme Heavy Hauler', type: 'Heavy Machinery', fuel: ['Diesel'], transmissions: ['Automatic', 'Manual'] },
      { model: '57X Highway Tractor', type: 'Trucks', fuel: ['Diesel'], transmissions: ['Automatic'] },
      { model: '47X Vocational Tipper', type: 'Construction Vehicles', fuel: ['Diesel'], transmissions: ['Automatic', 'Manual'] }
    ]
  },

  // ==========================================
  // X
  // ==========================================
  {
    company: 'XPeng',
    country: 'China',
    category: 'Electric Vehicles (EV)',
    vehicles: [
      { model: 'G9 Flagship SUV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 98, defaultRange: 570 },
      { model: 'G6 Ultra Smart Coupe', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 87.5, defaultRange: 570 },
      { model: 'P7i Sports Sedan', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 86.2, defaultRange: 576 },
      { model: 'X9 Luxury MPV', type: 'Vans', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 101.5, defaultRange: 640 },
      { model: 'MONA M03', type: 'Sedan', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 62.2, defaultRange: 620 }
    ]
  },

  // ==========================================
  // Y
  // ==========================================
  {
    company: 'Yamaha',
    country: 'Japan',
    category: 'Motorcycles',
    vehicles: [
      { model: 'YZF-R1M Superbike', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'YZF-R15 V4', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'MT-15 V2', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'MT-09 SP', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Tenere 700 Adventure', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'Aerox 155 Maxi-Scooter', type: 'Scooters', fuel: ['Petrol'], transmissions: ['CVT'] },
      { model: 'RayZR 125 Hybrid', type: 'Scooters', fuel: ['Hybrid', 'Petrol'], transmissions: ['CVT'] },
      { model: 'FZS-FI V4', type: 'Motorcycles', fuel: ['Petrol'], transmissions: ['Manual'] },
      { model: 'E-Vino', type: 'Scooters', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 1.2, defaultRange: 60 }
    ]
  },

  // ==========================================
  // Z
  // ==========================================
  {
    company: 'Zotye',
    country: 'China',
    category: 'Cars',
    vehicles: [
      { model: 'T600 SUV', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'Automatic'] },
      { model: 'T700 Luxury Crossover', type: 'SUV', fuel: ['Petrol'], transmissions: ['Dual-Clutch'] },
      { model: 'SR9', type: 'SUV', fuel: ['Petrol'], transmissions: ['Manual', 'Dual-Clutch'] },
      { model: 'Z500 Sedan', type: 'Sedan', fuel: ['Petrol', 'Electric'], transmissions: ['Manual', 'CVT'] },
      { model: 'E200 Micro EV', type: 'Electric Vehicles (EV)', fuel: ['Electric'], transmissions: ['Single-Speed'], defaultBatteryCapacity: 24.5, defaultRange: 220 }
    ]
  }
];

// Helper Functions
export const getAllVehicleCompanies = (): VehicleCompanyRecord[] => {
  return [...GLOBAL_VEHICLE_DATABASE].sort((a, b) => a.company.localeCompare(b.company));
};

export const getCompanyNames = (): string[] => {
  return GLOBAL_VEHICLE_DATABASE.map((c) => c.company).sort((a, b) => a.localeCompare(b));
};

export const getModelsForCompany = (companyName: string): VehicleModelSpec[] => {
  const found = GLOBAL_VEHICLE_DATABASE.find(
    (c) => c.company.toLowerCase() === (companyName || '').trim().toLowerCase()
  );
  return found ? found.vehicles : [];
};

export const getCompanyByName = (companyName: string): VehicleCompanyRecord | undefined => {
  return GLOBAL_VEHICLE_DATABASE.find(
    (c) => c.company.toLowerCase() === (companyName || '').trim().toLowerCase()
  );
};

export const getVehicleCategories = (): readonly string[] => {
  return VEHICLE_CATEGORIES;
};

export const searchVehicleCatalog = (query: string): VehicleCompanyRecord[] => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return getAllVehicleCompanies();

  return GLOBAL_VEHICLE_DATABASE.filter((item) => {
    const matchCompany = item.company.toLowerCase().includes(q);
    const matchCountry = item.country.toLowerCase().includes(q);
    const matchCategory = item.category.toLowerCase().includes(q);
    const matchModel = item.vehicles.some((v) => v.model.toLowerCase().includes(q) || v.type.toLowerCase().includes(q));
    return matchCompany || matchCountry || matchCategory || matchModel;
  });
};
