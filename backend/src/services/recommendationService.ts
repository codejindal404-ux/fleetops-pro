import { ServiceCenter } from '../types.ts';
import { firebaseService } from './firebaseService.ts';

export interface HaversineDistanceResult {
  distanceKm: number;
  distanceFormatted: string;
}

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_KM = 6371;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Number(distance.toFixed(2));
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export interface RecommendationScoredCenter extends ServiceCenter {
  distance: string;
  distanceKm: number;
  rating: number;
  completedServices: number;
  experience: number;
  recommendationScore: number;
  recommendationReason: string;
  recommendationReasons: string[];
  isBestChoice: boolean;
  scoreBreakdown: {
    ratingScore: number;
    distanceScore: number;
    serviceCountScore: number;
    experienceScore: number;
    total: number;
  };
}

export class RecommendationService {
  public static calculateRecommendationScore(
    center: ServiceCenter,
    customerLat: number,
    customerLng: number,
    maxRadiusKm: number = 50
  ): RecommendationScoredCenter {
    const distanceKm = calculateHaversineDistance(customerLat, customerLng, center.latitude, center.longitude);
    const distanceFormatted = formatDistance(distanceKm);

    const normalizedRating = Math.min(5, Math.max(0, center.averageRating || 0));
    const ratingScore = Number(((normalizedRating / 5) * 40).toFixed(2));

    const effectiveRadius = Math.max(10, maxRadiusKm);
    const distanceFactor = Math.max(0, 1 - distanceKm / effectiveRadius);
    const distanceScore = Number((distanceFactor * 30).toFixed(2));

    const serviceFactor = Math.min(1, (center.totalServicesCompleted || 0) / 1000);
    const serviceCountScore = Number((serviceFactor * 20).toFixed(2));

    const experienceFactor = Math.min(1, (center.experienceYears || 5) / 15);
    const experienceScore = Number((experienceFactor * 10).toFixed(2));

    const verifiedBonus = center.isVerified ? 2 : 0;
    const rawTotal = ratingScore + distanceScore + serviceCountScore + experienceScore + verifiedBonus;
    const totalScore = Number(Math.min(100, Math.max(0, rawTotal)).toFixed(1));

    const reasons: string[] = [];
    if ((center.averageRating || 0) >= 4.8) {
      reasons.push('Highest customer satisfaction & stellar 5-star feedback');
    }
    if (distanceKm <= 5) {
      reasons.push(`Rapid proximity (${distanceFormatted} away)`);
    } else if (distanceKm <= 15) {
      reasons.push(`Accessible location within ${distanceFormatted}`);
    }
    if ((center.totalServicesCompleted || 0) >= 500) {
      reasons.push(`High repair volume (${center.totalServicesCompleted}+ completed jobs)`);
    }
    if ((center.experienceYears || 0) >= 8) {
      reasons.push(`Senior master technicians (${center.experienceYears} yrs experience)`);
    }
    if (center.isVerified) {
      reasons.push('FleetOps Pro Certified & Verified Service Center');
    }

    const primaryReason =
      reasons.length > 0
        ? reasons[0]
        : 'Reliable certified automotive maintenance center';

    return {
      ...center,
      distance: distanceFormatted,
      distanceKm,
      rating: center.averageRating || 0,
      completedServices: center.totalServicesCompleted || 0,
      experience: center.experienceYears || 5,
      recommendationScore: totalScore,
      recommendationReason: primaryReason,
      recommendationReasons: reasons.slice(0, 3),
      isBestChoice: false,
      scoreBreakdown: {
        ratingScore,
        distanceScore,
        serviceCountScore,
        experienceScore,
        total: totalScore
      }
    };
  }

  public static async getRecommendations(
    customerLat: number,
    customerLng: number,
    radiusKm: number = 50
  ): Promise<RecommendationScoredCenter[]> {
    const allCenters = await firebaseService.getCollection<ServiceCenter>('serviceCenters');

    const scored = allCenters.map((c) =>
      this.calculateRecommendationScore(c, customerLat, customerLng, radiusKm)
    );

    let filtered = radiusKm > 0 ? scored.filter((c) => c.distanceKm <= radiusKm) : scored;
    if (filtered.length === 0) {
      filtered = scored;
    }

    filtered.sort((a, b) => b.recommendationScore - a.recommendationScore);

    if (filtered.length > 0) {
      filtered[0].isBestChoice = true;
    }

    return filtered;
  }

  public static async getNearbyCenters(
    customerLat: number,
    customerLng: number,
    radiusKm: number = 50
  ): Promise<RecommendationScoredCenter[]> {
    const list = await this.getRecommendations(customerLat, customerLng, radiusKm);
    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }
}

export default RecommendationService;
