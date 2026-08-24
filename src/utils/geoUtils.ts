/**
 * Geolocation & Haversine Distance Utilities for FleetOps Pro
 */

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Number(distance.toFixed(2));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats a distance in kilometers into a human-friendly label (e.g., "1.4 km" or "850 m")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Calculates the Smart Recommendation Score (0 - 100 scale)
 * Weights:
 * - 40% Customer Rating (out of 5.0)
 * - 30% Distance Proximity (closer is higher)
 * - 20% Total Completed Services (experience volume)
 * - 10% Years of Industry Experience
 */
export interface RecommendationScoreResult {
  totalScore: number;
  ratingScore: number;
  distanceScore: number;
  completedServicesScore: number;
  experienceScore: number;
  reasons: string[];
}

export function computeRecommendationScore(params: {
  rating: number;
  distanceKm: number;
  maxRadiusKm?: number;
  totalServicesCompleted: number;
  experienceYears: number;
  isVerified: boolean;
}): RecommendationScoreResult {
  const {
    rating,
    distanceKm,
    maxRadiusKm = 35,
    totalServicesCompleted,
    experienceYears,
    isVerified
  } = params;

  // 1. Rating Score: 40% (max 40 pts)
  const normalizedRating = Math.min(5, Math.max(0, rating));
  const ratingScore = Number(((normalizedRating / 5) * 40).toFixed(1));

  // 2. Distance Score: 30% (max 30 pts)
  // Linear decay within the radius window
  const effectiveMaxRadius = Math.max(10, maxRadiusKm);
  const distanceFactor = Math.max(0, 1 - distanceKm / effectiveMaxRadius);
  const distanceScore = Number((distanceFactor * 30).toFixed(1));

  // 3. Completed Services Score: 20% (max 20 pts)
  // 1000+ completed services gets full points
  const servicesFactor = Math.min(1, totalServicesCompleted / 1000);
  const completedServicesScore = Number((servicesFactor * 20).toFixed(1));

  // 4. Experience Score: 10% (max 10 pts)
  // 10+ years gets full points
  const experienceFactor = Math.min(1, experienceYears / 10);
  const experienceScore = Number((experienceFactor * 10).toFixed(1));

  // Bonus for Verified status (+2 bonus points capped at 100)
  const verifiedBonus = isVerified ? 2 : 0;

  const rawTotal = ratingScore + distanceScore + completedServicesScore + experienceScore + verifiedBonus;
  const totalScore = Number(Math.min(100, Math.max(0, rawTotal)).toFixed(1));

  // Generate dynamic recommendation reasons
  const reasons: string[] = [];
  if (rating >= 4.7) {
    reasons.push(`⭐ Exceptional ${rating.toFixed(1)}/5.0 customer satisfaction`);
  }
  if (distanceKm <= 5) {
    reasons.push(`📍 Rapid proximity (${formatDistance(distanceKm)} away)`);
  } else if (distanceKm <= 15) {
    reasons.push(`🚗 Accessible location within ${formatDistance(distanceKm)}`);
  }
  if (totalServicesCompleted >= 500) {
    reasons.push(`🔧 High repair volume (${totalServicesCompleted}+ completed jobs)`);
  }
  if (experienceYears >= 7) {
    reasons.push(`⏱️ Senior master technicians (${experienceYears} yrs experience)`);
  }
  if (isVerified) {
    reasons.push(`🛡️ FleetOps Pro Verified Service Center`);
  }

  return {
    totalScore,
    ratingScore,
    distanceScore,
    completedServicesScore,
    experienceScore,
    reasons: reasons.slice(0, 3)
  };
}
