/**
 * Smart Map-Based Service Center Recommendation Service
 * Implements Haversine distance calculations and multi-factor ranking algorithms.
 */

import { ServiceCenterRecord, dbStore } from './dbStore.ts';

export interface HaversineDistanceResult {
  distanceKm: number;
  distanceFormatted: string;
}

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
 * @param lat1 Customer latitude
 * @param lon1 Customer longitude
 * @param lat2 Service center latitude
 * @param lon2 Service center longitude
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_KM = 6371; // Earth's mean radius in km
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

export interface RecommendationScoredCenter extends ServiceCenterRecord {
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
  /**
   * Evaluates and computes recommendation scores for service centers relative to customer GPS.
   * Algorithm weights:
   * - 40% Customer Rating (Rating / 5 * 40)
   * - 30% Distance Proximity (Linear decay relative to search radius)
   * - 20% Completed Services volume (Normalized up to 1000 repairs)
   * - 10% Years of Industry Experience (Normalized up to 15 years)
   */
  public static calculateRecommendationScore(
    center: ServiceCenterRecord,
    customerLat: number,
    customerLng: number,
    maxRadiusKm: number = 50
  ): RecommendationScoredCenter {
    const distanceKm = calculateHaversineDistance(customerLat, customerLng, center.latitude, center.longitude);
    const distanceFormatted = formatDistance(distanceKm);

    // 1. Rating Score: 40%
    const normalizedRating = Math.min(5, Math.max(0, center.averageRating));
    const ratingScore = Number(((normalizedRating / 5) * 40).toFixed(2));

    // 2. Distance Score: 30%
    const effectiveRadius = Math.max(10, maxRadiusKm);
    const distanceFactor = Math.max(0, 1 - distanceKm / effectiveRadius);
    const distanceScore = Number((distanceFactor * 30).toFixed(2));

    // 3. Completed Services Score: 20%
    const serviceFactor = Math.min(1, center.totalServicesCompleted / 1000);
    const serviceCountScore = Number((serviceFactor * 20).toFixed(2));

    // 4. Experience Score: 10%
    const experienceFactor = Math.min(1, center.experienceYears / 15);
    const experienceScore = Number((experienceFactor * 10).toFixed(2));

    // Verified Bonus (+2 bonus points capped at 100)
    const verifiedBonus = center.isVerified ? 2 : 0;

    const rawTotal = ratingScore + distanceScore + serviceCountScore + experienceScore + verifiedBonus;
    const totalScore = Number(Math.min(100, Math.max(0, rawTotal)).toFixed(1));

    // Determine tailored recommendation reasons
    const reasons: string[] = [];
    if (center.averageRating >= 4.8) {
      reasons.push('Highest customer satisfaction & stellar 5-star feedback');
    }
    if (distanceKm <= 5) {
      reasons.push(`Rapid proximity (${distanceFormatted} away)`);
    } else if (distanceKm <= 15) {
      reasons.push(`Accessible location within ${distanceFormatted}`);
    }
    if (center.totalServicesCompleted >= 500) {
      reasons.push(`High repair volume (${center.totalServicesCompleted}+ completed jobs)`);
    }
    if (center.experienceYears >= 8) {
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
      rating: center.averageRating,
      completedServices: center.totalServicesCompleted,
      experience: center.experienceYears,
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

  /**
   * Fetches nearby service centers within radius and sorts by recommendation score descending.
   */
  public static getRecommendations(
    customerLat: number,
    customerLng: number,
    radiusKm: number = 50
  ): RecommendationScoredCenter[] {
    const allCenters = dbStore.getServiceCenters();

    const scored = allCenters.map((c) =>
      this.calculateRecommendationScore(c, customerLat, customerLng, radiusKm)
    );

    // Filter within radius if applicable (fallback to all if radius is 0 or no centers in strict radius)
    let filtered = radiusKm > 0 ? scored.filter((c) => c.distanceKm <= radiusKm) : scored;
    if (filtered.length === 0) {
      filtered = scored;
    }

    // Sort descending by recommendation score
    filtered.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Designate the #1 highest scoring center as isBestChoice
    if (filtered.length > 0) {
      filtered[0].isBestChoice = true;
    }

    return filtered;
  }

  /**
   * Fetches nearby service centers sorted primarily by distance.
   */
  public static getNearbyCenters(
    customerLat: number,
    customerLng: number,
    radiusKm: number = 50
  ): RecommendationScoredCenter[] {
    const list = this.getRecommendations(customerLat, customerLng, radiusKm);
    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }
}
