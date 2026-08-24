import React from 'react';
import {
  X,
  Star,
  MapPin,
  Phone,
  Wrench,
  Clock,
  ShieldCheck,
  Award,
  Users,
  Navigation,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ServiceCenter, ServiceCenterRecommendation } from '../../types.ts';
import { RecommendationBadge } from './RecommendationBadge.tsx';

interface ServiceCenterDetailsProps {
  center: ServiceCenter | ServiceCenterRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (center: ServiceCenter) => void;
}

export const ServiceCenterDetails: React.FC<ServiceCenterDetailsProps> = ({
  center,
  isOpen,
  onClose,
  onBookNow
}) => {
  if (!isOpen || !center) return null;

  const isRecommended =
    'recommendationScore' in center &&
    (center as ServiceCenterRecommendation).recommendationScore !== undefined;
  const recCenter = center as ServiceCenterRecommendation;

  return (
    <div
      id="modal-service-center-details"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Hero Image / Banner */}
        <div className="relative h-48 sm:h-60 w-full bg-zinc-800 overflow-hidden">
          <img
            src={
              center.imageUrl ||
              'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=800&auto=format&fit=crop&q=80'
            }
            alt={center.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

          {/* Close Button */}
          <button
            type="button"
            id="btn-close-center-details"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-950/70 text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-700/80 transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating Badges */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-3 flex-wrap">
            <div>
              {center.isBestChoice && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-lg mb-2">
                  <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
                  TOP RECOMMENDED SERVICE CENTER
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                {center.name}
              </h2>
            </div>

            {isRecommended && recCenter.recommendationScore > 0 && (
              <div className="px-3.5 py-1.5 rounded-2xl bg-zinc-950/90 border border-amber-500/50 backdrop-blur-md flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black text-amber-300">
                  {recCenter.recommendationScore}% Match
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Key Quick Info Row */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                {center.address}, {center.city}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {center.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-950/70 border border-blue-500/40 text-blue-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  FleetOps Pro Certified
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {center.workingStatus || 'OPEN'}
              </span>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-base font-black">{center.averageRating.toFixed(1)}</span>
                <span className="text-xs text-zinc-400">/ 5.0</span>
              </div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                {center.totalReviews} Customer Reviews
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                <Navigation className="w-4 h-4" />
                <span className="text-base font-black">
                  {center.distanceText || (center.distanceKm ? `${center.distanceKm.toFixed(1)} km` : 'Proximity')}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Haversine Distance
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-purple-400 mb-1">
                <Wrench className="w-4 h-4" />
                <span className="text-base font-black font-mono">
                  {center.totalServicesCompleted}+
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Jobs Completed
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-base font-black">{center.availableMechanics ?? 4} Bays</span>
              </div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                {center.experienceYears}y Experience
              </div>
            </div>
          </div>

          {/* AI Recommendation Reasoning */}
          {isRecommended && recCenter.recommendationReasons && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/20 via-zinc-900 to-blue-950/20 border border-amber-500/30">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Why FleetOps AI Recommends This Center</span>
              </div>
              <div className="space-y-1.5">
                {recCenter.recommendationReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specialties & Capabilities */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Workshop Capabilities & Specialized Services
            </h3>
            <div className="flex flex-wrap gap-2">
              {(center.specialties || [
                'Engine Overhaul',
                'EV Diagnostics',
                'Brake Service',
                'Fleet Calibration'
              ]).map((spec, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-medium text-zinc-200"
                >
                  🛠️ {spec}
                </span>
              ))}
            </div>
          </div>

          {/* GPS Coordinates & Contact Info */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                GPS Position
              </span>
              <span className="font-mono text-zinc-300">
                Lat: {center.latitude.toFixed(5)}, Lon: {center.longitude.toFixed(5)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                Direct Contact Phone
              </span>
              <a
                href={`tel:${center.phoneNumber || '+911140008800'}`}
                className="text-emerald-400 hover:underline font-mono"
              >
                {center.phoneNumber || '+91 11 4000 8800'}
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              id="btn-modal-book-now"
              onClick={() => {
                onClose();
                onBookNow(center);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-900/40 transition-all hover:scale-[1.02]"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment at This Workshop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
