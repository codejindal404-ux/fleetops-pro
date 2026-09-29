import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Building2,
  Filter,
  ShieldCheck,
  Star,
  RefreshCw,
  Plus,
  Compass,
  Award,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { ServiceCenter, ServiceCenterRecommendation, User } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import { ServiceCenterMap } from './ServiceCenterMap.tsx';
import { ServiceCenterCard } from './ServiceCenterCard.tsx';
import { LocationButton, LOCATION_PRESETS } from './LocationButton.tsx';
import { BookServiceAtCenterModal } from './BookServiceAtCenterModal.tsx';
import { AddServiceCenterModal } from './AddServiceCenterModal.tsx';

interface FindServiceCenterViewProps {
  currentUser: User | null;
  onNavigateToBookings?: () => void;
}

export const FindServiceCenterView: React.FC<FindServiceCenterViewProps> = ({
  currentUser,
  onNavigateToBookings
}) => {
  // State for user location (defaults to Connaught Place, Delhi)
  const [userLat, setUserLat] = useState(28.6315);
  const [userLng, setUserLng] = useState(77.2167);
  const [locationLabel, setLocationLabel] = useState('Delhi (Connaught Place)');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(30);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'recommendation' | 'distance' | 'rating' | 'repairs'>('recommendation');
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  // Data & loading states
  const [serviceCenters, setServiceCenters] = useState<ServiceCenterRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);

  // Modals
  const [bookingModalCenter, setBookingModalCenter] = useState<ServiceCenter | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch recommendations whenever user location or radius changes
  useEffect(() => {
    fetchRecommendations();
  }, [userLat, userLng, radiusKm]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getRecommendedServiceCenters(userLat, userLng, radiusKm);
      setServiceCenters(data.recommendations || []);
      if (data.recommendations && data.recommendations.length > 0 && !selectedCenterId) {
        setSelectedCenterId(data.recommendations[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch recommended service centers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number, label?: string) => {
    setUserLat(lat);
    setUserLng(lng);
    if (label) setLocationLabel(label);
  };

  const handleSelectCenter = (center: ServiceCenter) => {
    setSelectedCenterId(center.id);
  };

  const handleBookService = (center: ServiceCenter) => {
    setBookingModalCenter(center);
  };

  const handleToggleVerify = async (id: string, currentVerified: boolean) => {
    try {
      await apiClient.verifyServiceCenter(id, !currentVerified);
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to update verification:', err);
    }
  };

  // Filter and sort centers locally for instant responsiveness
  const filteredCenters = serviceCenters
    .filter((center) => {
      if (verifiedOnly && !center.isVerified) return false;
      if (minRating > 0 && center.averageRating < minRating) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = center.name.toLowerCase().includes(query);
        const matchesCity = center.city.toLowerCase().includes(query);
        const matchesAddress = center.address.toLowerCase().includes(query);
        const matchesSpecialties = center.specialties?.some((s) => s.toLowerCase().includes(query));
        return matchesName || matchesCity || matchesAddress || matchesSpecialties;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') {
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      }
      if (sortBy === 'rating') {
        return b.averageRating - a.averageRating;
      }
      if (sortBy === 'repairs') {
        return b.totalServicesCompleted - a.totalServicesCompleted;
      }
      // Default: Recommendation score descending
      return (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0);
    });

  const bestChoiceCenter = filteredCenters.find((c) => c.isBestChoice);

  return (
    <div id="view-find-service-centers" className="space-y-6 pb-12">
      {/* Header & Subtitle */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600/30 to-amber-500/20 border border-blue-500/30 text-blue-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
                <span>Smart Service Center Finder</span>
                <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  AI Weighted Engine
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Compare verified workshops, evaluate live repair quality, and book top-rated garages nearby
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions: Location detection + Register Workshop button for Admins */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <LocationButton
            currentLat={userLat}
            currentLng={userLng}
            onLocationChange={handleLocationChange}
            isLoading={loading}
          />

          <button
            type="button"
            id="btn-refresh-centers"
            onClick={fetchRecommendations}
            disabled={loading}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
            title="Refresh Recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MECHANIC') && (
            <button
              type="button"
              id="btn-add-service-center-trigger"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Workshop</span>
            </button>
          )}
        </div>
      </div>

      {/* Algorithm Banner & Explanation Accordion */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-zinc-900 to-amber-950/30 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-200 flex items-center gap-2 flex-wrap">
              <span>Multi-Factor Recommendation Formula</span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                (0.4 × Rating) + (0.3 × Proximity) + (0.2 × Repairs) + (0.1 × Experience)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Rankings automatically balance certified review scores, Haversine distance from your GPS location, and technician experience.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-toggle-formula-details"
          onClick={() => setShowFormulaInfo(!showFormulaInfo)}
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold px-3 py-1.5 rounded-lg bg-blue-950/50 border border-blue-800/40 shrink-0 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showFormulaInfo ? 'Hide Weights' : 'View Breakdown'}</span>
        </button>
      </div>

      {/* Detailed Algorithm Weight Drawer */}
      {showFormulaInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-zinc-900 border border-zinc-700/80 rounded-2xl">
          <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
            <div className="text-amber-400 font-bold text-xs flex items-center justify-between">
              <span>⭐ Customer Rating</span>
              <span className="font-mono">40%</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              (Rating / 5.0) × 40 points. Heavily weights genuine feedback from completed repairs.
            </div>
          </div>

          <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
            <div className="text-blue-400 font-bold text-xs flex items-center justify-between">
              <span>📍 Distance Proximity</span>
              <span className="font-mono">30%</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Max 30 pts at &lt;2km, tapering linearly across selected radius via Haversine calculation.
            </div>
          </div>

          <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
            <div className="text-purple-400 font-bold text-xs flex items-center justify-between">
              <span>🔧 Repairs Completed</span>
              <span className="font-mono">20%</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              (Completed Services / 100) × 20 points. Rewards high-volume, battle-tested workshops.
            </div>
          </div>

          <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
            <div className="text-emerald-400 font-bold text-xs flex items-center justify-between">
              <span>⏱️ Industry Experience</span>
              <span className="font-mono">10%</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              (Years of Operation / 20) × 10 points. Gives bonus credibility to veteran garages.
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls & Filters Bar */}
      <div className="p-4 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-3.5 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-service-centers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search garage name, city, address, or specialty (e.g. EV Battery, Brake)..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Radius Slider */}
          <div className="md:col-span-4 flex items-center gap-3 px-3 py-1.5 bg-zinc-800/80 rounded-xl border border-zinc-700">
            <span className="text-xs text-zinc-400 whitespace-nowrap font-medium">Radius:</span>
            <input
              type="range"
              id="slider-search-radius"
              min="5"
              max="100"
              step="5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
            />
            <span className="text-xs font-mono font-bold text-blue-400 whitespace-nowrap">
              {radiusKm} km
            </span>
          </div>

          {/* Quick Sort Selector */}
          <div className="md:col-span-3">
            <select
              id="select-sort-service-centers"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="recommendation">⭐ Smart Recommendation</option>
              <option value="distance">📍 Closest Distance</option>
              <option value="rating">★ Highest Customer Rating</option>
              <option value="repairs">🔧 Most Services Completed</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="filter-verified-toggle"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                verifiedOnly
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Verified Only</span>
            </button>

            <div className="flex items-center gap-1 text-xs text-zinc-400 ml-2">
              <span>Min Rating:</span>
              {[0, 4.0, 4.5, 4.8].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  id={`filter-rating-${stars}`}
                  onClick={() => setMinRating(stars)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors ${
                    minRating === stars
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {stars === 0 ? 'All' : `★ ${stars}+`}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-zinc-400">
            Showing <strong className="text-zinc-100">{filteredCenters.length}</strong> service centers
            {locationLabel && <span className="text-zinc-400"> near {locationLabel}</span>}
          </div>
        </div>
      </div>

      {/* Main Content Layout: Side-by-Side Map & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Leaflet Map (Sticky on Desktop) */}
        <div className="lg:col-span-7 h-[420px] lg:h-[720px] lg:sticky lg:top-20">
          <ServiceCenterMap
            userLat={userLat}
            userLng={userLng}
            serviceCenters={filteredCenters}
            selectedCenterId={selectedCenterId}
            onSelectCenter={handleSelectCenter}
            onBookService={handleBookService}
            radiusKm={radiusKm}
          />
        </div>

        {/* Right Column: Ranked Recommendation Cards List */}
        <div className="lg:col-span-5 space-y-4 max-h-[720px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
              <span>Analyzing nearby workshops & computing weighted match scores...</span>
            </div>
          ) : filteredCenters.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-zinc-500 opacity-60" />
              <p className="text-sm font-semibold text-zinc-300">No service centers found</p>
              <p className="text-xs text-zinc-500 mt-1">
                Try expanding the search radius slider or clearing the filters above.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRadiusKm(100);
                  setVerifiedOnly(false);
                  setMinRating(0);
                  setSearchQuery('');
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30"
              >
                Reset Filters to 100km
              </button>
            </div>
          ) : (
            filteredCenters.map((center) => (
              <ServiceCenterCard
                key={center.id}
                center={center}
                isSelected={selectedCenterId === center.id}
                onSelect={handleSelectCenter}
                onBookService={handleBookService}
                onShowDirections={handleSelectCenter}
                userRole={currentUser?.role}
                onToggleVerify={handleToggleVerify}
              />
            ))
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalCenter && (
        <BookServiceAtCenterModal
          center={bookingModalCenter}
          isOpen={Boolean(bookingModalCenter)}
          onClose={() => setBookingModalCenter(null)}
          onBookingSuccess={() => {
            if (onNavigateToBookings) onNavigateToBookings();
          }}
        />
      )}

      {/* Add Center Modal for Admins */}
      {showAddModal && (
        <AddServiceCenterModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newCenter) => {
            fetchRecommendations();
          }}
          userRole={currentUser?.role}
        />
      )}
    </div>
  );
};
