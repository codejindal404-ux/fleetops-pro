import React from 'react';
import {
  Star,
  MapPin,
  Phone,
  Wrench,
  Calendar,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  Users
} from 'lucide-react';
import { ServiceCenterRecommendation, ServiceCenter } from '../../types.ts';
import { RecommendationBadge } from './RecommendationBadge.tsx';

interface ServiceCenterCardProps {
  center: ServiceCenterRecommendation | ServiceCenter;
  isSelected?: boolean;
  onSelect?: (center: ServiceCenter) => void;
  onBookService?: (center: ServiceCenter) => void;
  onShowDirections?: (center: ServiceCenter) => void;
  userRole?: string;
  onToggleVerify?: (id: string, currentVerified: boolean) => void;
  onUpdateStatus?: (id: string, currentStatus: string) => void;
}

export const ServiceCenterCard: React.FC<ServiceCenterCardProps> = ({
  center,
  isSelected = false,
  onSelect,
  onBookService,
  onShowDirections,
  userRole,
  onToggleVerify,
  onUpdateStatus
}) => {
  const isRecommended = 'recommendationScore' in center && (center as ServiceCenterRecommendation).recommendationScore !== undefined;
  const recCenter = center as ServiceCenterRecommendation;

  // Working status badge colors
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300';
      case 'BUSY':
        return 'bg-amber-950/70 border-amber-500/40 text-amber-300';
      case 'CLOSED':
        return 'bg-zinc-800 border-zinc-700 text-zinc-400';
      default:
        return 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300';
    }
  };

  return (
    <div
      id={`card-service-center-${center.id}`}
      onClick={() => onSelect && onSelect(center)}
      className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer border ${
        center.isBestChoice
          ? 'bg-gradient-to-b from-zinc-900 via-zinc-900 to-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/30'
          : isSelected
          ? 'bg-zinc-900 border-blue-500 ring-1 ring-blue-500/50 shadow-xl shadow-blue-950/30'
          : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-md'
      }`}
    >
      {/* Top Banner if Best Choice */}
      {center.isBestChoice && (
        <div className="absolute -top-3 left-4 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-md">
          <Sparkles className="w-3 h-3 fill-zinc-950" />
          RECOMMENDED BY FLEETOPS AI
        </div>
      )}

      {/* Header Row: Title & Badges */}
      <div className="flex items-start justify-between gap-3 mt-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base text-zinc-100 group-hover:text-blue-300 transition-colors truncate">
              {center.name}
            </h3>
            {center.isVerified && (
              <span
                title="Verified Service Center"
                className="inline-flex items-center text-blue-400 bg-blue-950/60 border border-blue-500/30 px-1.5 py-0.5 rounded text-[10px] font-semibold"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified
              </span>
            )}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(
                center.workingStatus
              )}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />
              {center.workingStatus || 'OPEN'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="truncate">{center.address}, {center.city}</span>
          </div>
        </div>

        {/* Score Pill */}
        {isRecommended && recCenter.recommendationScore > 0 && (
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-black font-mono text-zinc-100">
                {recCenter.recommendationScore}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">pts</span>
            </div>
            <span className="text-[9px] text-zinc-400 mt-0.5 font-medium">Smart Score</span>
          </div>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Star className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 flex items-center gap-1">
              <span>{center.averageRating.toFixed(1)}</span>
              <span className="text-[10px] text-zinc-400 font-normal">({center.totalReviews})</span>
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Rating</div>
          </div>
        </div>

        {/* Distance */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100">
              {center.distanceText || (center.distanceKm !== undefined ? `${center.distanceKm.toFixed(1)} km` : 'Near')}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Distance</div>
          </div>
        </div>

        {/* Completed Services */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 font-mono">
              {center.totalServicesCompleted}+
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Repairs</div>
          </div>
        </div>

        {/* Mechanics / Experience */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100">
              {center.availableMechanics ?? 3} Active
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">{center.experienceYears}y Exp</div>
          </div>
        </div>
      </div>

      {/* Recommendation Reasons / Highlights */}
      {isRecommended && recCenter.recommendationReasons && recCenter.recommendationReasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recCenter.recommendationReasons.map((reason, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 border border-zinc-700/60"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Specialties Tags */}
      {center.specialties && center.specialties.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Expertise:</span>
          {center.specialties.map((spec, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-300 border border-zinc-700/50"
            >
              {spec}
            </span>
          ))}
        </div>
      )}

      {/* Score Breakdown Bar (Visual algorithm representation) */}
      {isRecommended && recCenter.scoreBreakdown && (
        <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Score Weights</span>
            <span className="font-mono text-zinc-300">
              R:{recCenter.scoreBreakdown.ratingScore} + D:{recCenter.scoreBreakdown.distanceScore} + S:{recCenter.scoreBreakdown.completedServicesScore} + E:{recCenter.scoreBreakdown.experienceScore}
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${(recCenter.scoreBreakdown.ratingScore / 40) * 40}%` }}
              className="bg-amber-400"
              title={`Rating: ${recCenter.scoreBreakdown.ratingScore}/40`}
            />
            <div
              style={{ width: `${(recCenter.scoreBreakdown.distanceScore / 30) * 30}%` }}
              className="bg-blue-400"
              title={`Distance: ${recCenter.scoreBreakdown.distanceScore}/30`}
            />
            <div
              style={{ width: `${(recCenter.scoreBreakdown.completedServicesScore / 20) * 20}%` }}
              className="bg-purple-400"
              title={`Services: ${recCenter.scoreBreakdown.completedServicesScore}/20`}
            />
            <div
              style={{ width: `${(recCenter.scoreBreakdown.experienceScore / 10) * 10}%` }}
              className="bg-emerald-400"
              title={`Experience: ${recCenter.scoreBreakdown.experienceScore}/10`}
            />
          </div>
        </div>
      )}

      {/* Actions Row */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {center.phoneNumber && (
            <a
              href={`tel:${center.phoneNumber}`}
              onClick={(e) => e.stopPropagation()}
              id={`btn-call-center-${center.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call</span>
            </a>
          )}
          <button
            type="button"
            id={`btn-directions-center-${center.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onShowDirections && onShowDirections(center);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span>Map Focus</span>
          </button>
        </div>

        {/* Primary CTA */}
        <div className="flex items-center gap-2">
          {userRole === 'ADMIN' && (
            <button
              type="button"
              id={`btn-admin-verify-${center.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleVerify && onToggleVerify(center.id, center.isVerified);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                center.isVerified
                  ? 'border-red-500/40 text-red-300 hover:bg-red-950/40'
                  : 'border-blue-500/40 text-blue-300 hover:bg-blue-950/40'
              }`}
            >
              {center.isVerified ? 'Unverify' : 'Verify'}
            </button>
          )}

          <button
            type="button"
            id={`btn-book-center-${center.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onBookService && onBookService(center);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/40 transition-all hover:scale-[1.02]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Here</span>
          </button>
        </div>
      </div>
    </div>
  );
};
