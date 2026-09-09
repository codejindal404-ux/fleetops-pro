import { LucideIcon, Car, Truck, Bus, Zap, ShieldCheck } from 'lucide-react';
import vehicleSedanImg from '../assets/images/vehicle_sedan_1785355520687.jpg';
import vehicleTruckImg from '../assets/images/vehicle_truck_1785355537774.jpg';
import vehicleVanImg from '../assets/images/vehicle_van_1785355569391.jpg';
import vehicleBusImg from '../assets/images/vehicle_bus_1785355604471.jpg';

export interface VehicleVisualData {
  img: string;
  alt: string;
  label: string;
  category: string;
  icon: LucideIcon;
  badgeBg: string;
  gradientBg: string;
}

// Curated high-resolution, responsive vehicle images
const VEHICLE_IMAGE_MAP: Record<string, string> = {
  sedan: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1000&q=80',
  suv: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80',
  electric: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=80',
  sports: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
  luxury: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80',
  hatchback: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
  pickup: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=80',
  truck: vehicleTruckImg,
  van: vehicleVanImg,
  bus: vehicleBusImg,
  motorcycle: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80'
};

/**
 * Get accurate, high-definition vehicle illustration & photo based on brand, model, type, or custom image.
 */
export function getVehicleIllustration(
  vehicleType?: string,
  model?: string,
  company?: string,
  customImage?: string
): VehicleVisualData {
  if (customImage && customImage.trim().startsWith('http')) {
    return {
      img: customImage,
      alt: `${company || ''} ${model || 'Vehicle'}`.trim(),
      label: vehicleType || 'Fleet Vehicle',
      category: vehicleType || 'Fleet Vehicle',
      icon: Car,
      badgeBg: 'bg-amber-500 text-slate-950',
      gradientBg: 'from-amber-500/20 to-slate-950'
    };
  }

  const t = (vehicleType || '').toLowerCase();
  const m = (model || '').toLowerCase();
  const c = (company || '').toLowerCase();

  // 1. Electric Vehicles (EV)
  if (
    t.includes('electric') ||
    t.includes('ev') ||
    m.includes('e-tron') ||
    m.includes('taycan') ||
    m.includes('ioniq') ||
    m.includes('model 3') ||
    m.includes('model y') ||
    m.includes('model s') ||
    m.includes('model x') ||
    m.includes('cybertruck') ||
    m.includes('leaf') ||
    m.includes('seal') ||
    c.includes('tesla') ||
    c.includes('rivian') ||
    c.includes('polestar') ||
    c.includes('lucid') ||
    c.includes('byd')
  ) {
    return {
      img: VEHICLE_IMAGE_MAP.electric,
      alt: `${company || ''} ${model || ''} Electric Vehicle (EV)`.trim(),
      label: 'Electric EV',
      category: 'Electric Vehicles (EV)',
      icon: Zap,
      badgeBg: 'bg-emerald-500 text-slate-950 font-bold',
      gradientBg: 'from-emerald-500/20 to-slate-950'
    };
  }

  // 2. Heavy Commercial Trucks
  if (
    t === 'truck' ||
    t.includes('heavy') ||
    t.includes('commercial') ||
    m.includes('actros') ||
    m.includes('fh') ||
    m.includes('scania') ||
    m.includes('volvo truck') ||
    m.includes('man tgx') ||
    m.includes('isuzu giga')
  ) {
    return {
      img: VEHICLE_IMAGE_MAP.truck || vehicleTruckImg,
      alt: `${company || ''} ${model || ''} Heavy Transport Fleet Truck`.trim(),
      label: 'Commercial Truck',
      category: 'Trucks',
      icon: Truck,
      badgeBg: 'bg-indigo-500 text-white font-bold',
      gradientBg: 'from-indigo-500/20 to-slate-950'
    };
  }

  // 3. Pickup Trucks / Off-Road
  if (
    t.includes('pickup') ||
    m.includes('f-150') ||
    m.includes('silverado') ||
    m.includes('ram 1500') ||
    m.includes('hilux') ||
    m.includes('ranger') ||
    m.includes('tacoma') ||
    m.includes('colorado') ||
    m.includes('navara') ||
    m.includes('amarok')
  ) {
    return {
      img: VEHICLE_IMAGE_MAP.pickup,
      alt: `${company || ''} ${model || ''} Pickup Truck`.trim(),
      label: 'Pickup Truck',
      category: 'Pickup Trucks',
      icon: Truck,
      badgeBg: 'bg-amber-600 text-white font-bold',
      gradientBg: 'from-amber-600/20 to-slate-950'
    };
  }

  // 4. Vans & Light Commercial Delivery
  if (
    t.includes('van') ||
    m.includes('transit') ||
    m.includes('sprinter') ||
    m.includes('hiace') ||
    m.includes('crafter') ||
    m.includes('vito') ||
    m.includes('proace') ||
    m.includes('nv200') ||
    m.includes('boxer') ||
    m.includes('ducato')
  ) {
    return {
      img: VEHICLE_IMAGE_MAP.van || vehicleVanImg,
      alt: `${company || ''} ${model || ''} Commercial Delivery Van`.trim(),
      label: 'Delivery Van',
      category: 'Vans',
      icon: Truck,
      badgeBg: 'bg-amber-500 text-slate-950 font-bold',
      gradientBg: 'from-amber-500/20 to-slate-950'
    };
  }

  // 5. Buses & Passenger Shuttles
  if (
    t.includes('bus') ||
    m.includes('bus') ||
    m.includes('shuttle') ||
    m.includes('tourismo') ||
    m.includes('coach') ||
    m.includes('coaster')
  ) {
    return {
      img: VEHICLE_IMAGE_MAP.bus || vehicleBusImg,
      alt: `${company || ''} ${model || ''} Passenger Fleet Bus`.trim(),
      label: 'Passenger Bus',
      category: 'Buses',
      icon: Bus,
      badgeBg: 'bg-emerald-500 text-white font-bold',
      gradientBg: 'from-emerald-500/20 to-slate-950'
    };
  }

  // 6. Motorcycles & Two-Wheelers
  if (
    t.includes('motorcycle') ||
    t.includes('scooter') ||
    t.includes('two-wheeler') ||
    c.includes('harley') ||
    c.includes('ducati') ||
    c.includes('yamaha') ||
    c.includes('kawasaki') ||
    c.includes('ktm') ||
    c.includes('royal enfield') ||
    m.includes('ninja') ||
    m.includes('cbr') ||
    m.includes('r1') ||
    m.includes('vespa')
  ) {
    return {
      img: VEHICLE_IMAGE_MAP.motorcycle,
      alt: `${company || ''} ${model || ''} Motorcycle`.trim(),
      label: 'Motorcycle',
      category: 'Motorcycles',
      icon: Car,
      badgeBg: 'bg-rose-500 text-white font-bold',
      gradientBg: 'from-rose-500/20 to-slate-950'
    };
  }

  // 7. Sports Cars & Supercars
  if (
    t.includes('sports') ||
    t.includes('coupe') ||
    c.includes('ferrari') ||
    c.includes('lamborghini') ||
    c.includes('porsche') ||
    c.includes('mclaren') ||
    c.includes('aston martin') ||
    m.includes('911') ||
    m.includes('mustang') ||
    m.includes('corvette') ||
    m.includes('camaro') ||
    m.includes('supra') ||
    m.includes('gt-r') ||
    m.includes('m4') ||
    m.includes('m8') ||
    m.includes('amg gt')
  ) {
    return {
      img: VEHICLE_IMAGE_MAP.sports,
      alt: `${company || ''} ${model || ''} High-Performance Sports Car`.trim(),
      label: 'Sports Coupe',
      category: 'Sports Cars',
      icon: Car,
      badgeBg: 'bg-rose-600 text-white font-bold',
      gradientBg: 'from-rose-600/20 to-slate-950'
    };
  }

  // 8. Luxury Cars
  if (
    t.includes('luxury') ||
    c.includes('rolls-royce') ||
    c.includes('bentley') ||
    c.includes('maybach') ||
    m.includes('s-class') ||
    m.includes('7 series') ||
    m.includes('a8') ||
    m.includes('panamera') ||
    m.includes('ghost') ||
    m.includes('phantom')
  ) {
    return {
      img: VEHICLE_IMAGE_MAP.luxury,
      alt: `${company || ''} ${model || ''} Luxury Executive Vehicle`.trim(),
      label: 'Ultra Luxury',
      category: 'Luxury Cars',
      icon: Car,
      badgeBg: 'bg-purple-600 text-white font-bold',
      gradientBg: 'from-purple-600/20 to-slate-950'
    };
  }

  // 9. SUVs & Crossovers
  if (
    t.includes('suv') ||
    t.includes('crossover') ||
    m.includes('q3') ||
    m.includes('q5') ||
    m.includes('q7') ||
    m.includes('x3') ||
    m.includes('x5') ||
    m.includes('x7') ||
    m.includes('glc') ||
    m.includes('gle') ||
    m.includes('gls') ||
    m.includes('g-class') ||
    m.includes('rav4') ||
    m.includes('highlander') ||
    m.includes('land cruiser') ||
    m.includes('prado') ||
    m.includes('fortuner') ||
    m.includes('creta') ||
    m.includes('tucson') ||
    m.includes('santa fe') ||
    m.includes('explorer') ||
    m.includes('wrangler') ||
    m.includes('grand cherokee') ||
    m.includes('defender') ||
    m.includes('range rover') ||
    m.includes('discovery') ||
    m.includes('sportage') ||
    m.includes('sorento') ||
    m.includes('telluride') ||
    m.includes('cx-5') ||
    m.includes('cx-90') ||
    m.includes('tiguan') ||
    m.includes('touareg') ||
    m.includes('atlas') ||
    m.includes('cr-v') ||
    m.includes('pilot') ||
    m.includes('pathfinder') ||
    m.includes('patrol') ||
    m.includes('outback') ||
    m.includes('forester')
  ) {
    return {
      img: VEHICLE_IMAGE_MAP.suv,
      alt: `${company || ''} ${model || ''} Premium SUV`.trim(),
      label: 'SUV / Crossover',
      category: 'SUVs',
      icon: Car,
      badgeBg: 'bg-amber-500 text-slate-950 font-bold',
      gradientBg: 'from-amber-500/20 to-slate-950'
    };
  }

  // 10. Hatchbacks & Compacts
  if (
    t.includes('hatchback') ||
    m.includes('golf') ||
    m.includes('polo') ||
    m.includes('mini') ||
    m.includes('cooper') ||
    m.includes('swift') ||
    m.includes('i20') ||
    m.includes('fit') ||
    m.includes('yaris') ||
    m.includes('a-class') ||
    m.includes('1 series') ||
    m.includes('a3') ||
    m.includes('clio') ||
    m.includes('fiesta') ||
    m.includes('focus')
  ) {
    return {
      img: VEHICLE_IMAGE_MAP.hatchback,
      alt: `${company || ''} ${model || ''} Urban Compact Hatchback`.trim(),
      label: 'Hatchback',
      category: 'Hatchbacks',
      icon: Car,
      badgeBg: 'bg-teal-500 text-white font-bold',
      gradientBg: 'from-teal-500/20 to-slate-950'
    };
  }

  // 11. Default: Executive Sedan & Cars
  return {
    img: VEHICLE_IMAGE_MAP.sedan || vehicleSedanImg,
    alt: `${company || ''} ${model || 'Executive Fleet Sedan'}`.trim(),
    label: 'Executive Sedan',
    category: 'Sedans',
    icon: Car,
    badgeBg: 'bg-sky-500 text-white font-bold',
    gradientBg: 'from-sky-500/20 to-slate-950'
  };
}
