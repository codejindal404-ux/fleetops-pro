/**
 * Geolocation & Haversine Distance Utilities for FleetOps Pro
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

export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

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

  const normalizedRating = Math.min(5, Math.max(0, rating));
  const ratingScore = Number(((normalizedRating / 5) * 40).toFixed(1));

  const effectiveMaxRadius = Math.max(10, maxRadiusKm);
  const distanceFactor = Math.max(0, 1 - distanceKm / effectiveMaxRadius);
  const distanceScore = Number((distanceFactor * 30).toFixed(1));

  const servicesFactor = Math.min(1, totalServicesCompleted / 1000);
  const completedServicesScore = Number((servicesFactor * 20).toFixed(1));

  const experienceFactor = Math.min(1, experienceYears / 10);
  const experienceScore = Number((experienceFactor * 10).toFixed(1));

  const verifiedBonus = isVerified ? 2 : 0;

  const rawTotal = ratingScore + distanceScore + completedServicesScore + experienceScore + verifiedBonus;
  const totalScore = Number(Math.min(100, Math.max(0, rawTotal)).toFixed(1));

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
