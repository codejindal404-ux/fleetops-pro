import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Navigation,
  Compass,
  ArrowLeft,
  X,
  Wrench,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User, ServiceCenter, MechanicProfile } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import { ServiceCenterMap } from '../service-center/ServiceCenterMap.tsx';

export interface MechanicServiceCenterViewProps {
  currentUser?: User | null;
  profile?: MechanicProfile | null;
  assignedCenter?: ServiceCenter | null;
  onNavigateToDashboard?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const MechanicServiceCenterView: React.FC<MechanicServiceCenterViewProps> = ({
  currentUser,
  profile: initialProfile,
  assignedCenter: initialCenter,
  onNavigateToDashboard,
  onClose,
  isModal = false
}) => {
  const [profile, setProfile] = useState<MechanicProfile | null>(initialProfile || null);
  const [serviceCenter, setServiceCenter] = useState<ServiceCenter | null>(initialCenter || null);
  const [loading, setLoading] = useState<boolean>(!initialCenter && !initialProfile);
  const [error, setError] = useState<string | null>(null);

  // Sync state if props change
  useEffect(() => {
    if (initialProfile) setProfile(initialProfile);
    if (initialCenter) setServiceCenter(initialCenter);
  }, [initialProfile, initialCenter]);

  // Load mechanic profile and assigned service center
  useEffect(() => {
    let isSubscribed = true;

    async function loadAssignedCenter() {
      // If already provided via props, no need to refetch
      if (initialCenter && initialCenter.name) {
        setServiceCenter(initialCenter);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let activeProfile = profile;
        if (!activeProfile) {
          const profileRes = await apiClient.getMechanicProfile();
          if (profileRes?.profile) {
            activeProfile = profileRes.profile;
            if (isSubscribed) setProfile(activeProfile);
          }
        }

        // If profile already contains assignedServiceCenter object
        if (activeProfile?.assignedServiceCenter?.name) {
          if (isSubscribed) {
            setServiceCenter(activeProfile.assignedServiceCenter as ServiceCenter);
            setLoading(false);
          }
          return;
        }

        // Otherwise resolve via assignedServiceCenterId
        const centerId = activeProfile?.assignedServiceCenterId || currentUser?.assignedServiceCenterId;
        if (centerId) {
          try {
            const centerRes = await apiClient.getServiceCenterById(centerId);
            if (centerRes?.serviceCenter && isSubscribed) {
              setServiceCenter(centerRes.serviceCenter);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Could not fetch service center by ID:', e);
          }
        }

        // Fallback to profile embedded fields
        if (activeProfile?.serviceCenterName && isSubscribed) {
          const cLat = typeof activeProfile.serviceCenterLatitude === 'number' && !isNaN(activeProfile.serviceCenterLatitude)
            ? activeProfile.serviceCenterLatitude
            : null;
          const cLng = typeof activeProfile.serviceCenterLongitude === 'number' && !isNaN(activeProfile.serviceCenterLongitude)
            ? activeProfile.serviceCenterLongitude
            : null;

          setServiceCenter({
            id: activeProfile.assignedServiceCenterId || 'assigned-center',
            name: activeProfile.serviceCenterName,
            address: activeProfile.serviceCenterAddress || 'Facility Bay Location',
            city: activeProfile.serviceCenterCity || 'Main Depot',
            latitude: cLat !== null ? cLat : (undefined as any),
            longitude: cLng !== null ? cLng : (undefined as any),
            phoneNumber: activeProfile.serviceCenterPhone || '+1 (555) 019-2834',
            averageRating: activeProfile.rating || 4.8,
            totalReviews: activeProfile.totalRatingsCount || 12,
            totalServicesCompleted: activeProfile.completedJobsCount || 35,
            experienceYears: activeProfile.experienceYears || 6,
            isVerified: true,
            workingStatus: (activeProfile.serviceCenterStatus as any) || 'OPEN',
            availableMechanics: 4,
            specialties: activeProfile.specialties || ['Diagnostics', 'Engine & Brakes'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err: any) {
        if (isSubscribed) {
          setError(err.message || 'Unable to load assigned service center.');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadAssignedCenter();

    return () => {
      isSubscribed = false;
    };
  }, [currentUser?.id, currentUser?.assignedServiceCenterId, initialCenter]);

  // Determine if valid coordinates are present
  const rawLat = serviceCenter?.latitude;
  const rawLng = serviceCenter?.longitude;
  const hasValidCoordinates =
    rawLat !== undefined &&
    rawLat !== null &&
    rawLng !== undefined &&
    rawLng !== null &&
    !isNaN(Number(rawLat)) &&
    !isNaN(Number(rawLng));

  const centerLat = hasValidCoordinates ? Number(rawLat) : 0;
  const centerLng = hasValidCoordinates ? Number(rawLng) : 0;

  const centerName = serviceCenter?.name || profile?.serviceCenterName || 'Assigned Technical Facility';
  const centerAddress = serviceCenter?.address || profile?.serviceCenterAddress || 'Address on file';
  const centerCity = serviceCenter?.city || profile?.serviceCenterCity || 'Local District';
  const centerPhone = serviceCenter?.phoneNumber || profile?.serviceCenterPhone || '+1 (555) 019-2834';
  const centerStatus = serviceCenter?.workingStatus || profile?.serviceCenterStatus || 'OPEN';

  return (
    <div
      data-testid="mechanic-service-center-map-container"
      className={`w-full max-w-full overflow-x-hidden ${
        isModal
          ? 'p-0'
          : 'space-y-6 pb-12'
      }`}
    >
      {/* Header bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            {onNavigateToDashboard && !isModal && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-black text-white font-['Oswald'] uppercase tracking-wide">
                  {centerName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Assigned Bay Facility
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    centerStatus === 'OPEN'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : 'bg-zinc-700 text-zinc-300 border border-zinc-600'
                  }`}
                >
                  {centerStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{centerAddress}, {centerCity}</span>
                {profile?.badgeNumber && (
                  <span className="text-slate-400 border-l border-slate-800 pl-2">
                    Station: <strong className="text-amber-400">{profile.badgeNumber}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {profile?.shiftName && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{profile.shiftName}</span>
              </span>
            )}
            {onClose && isModal && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
          <span>Locating assigned service center & telemetry coordinates...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="font-bold">Error loading facility data</p>
            <p className="text-slate-400 mt-0.5">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          {/* Main Map or Missing Coordinates Card (8 cols on desktop) */}
          <div className="lg:col-span-8 w-full space-y-4">
            {hasValidCoordinates && serviceCenter ? (
              <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[540px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
                <ServiceCenterMap
                  userLat={centerLat}
                  userLng={centerLng}
                  serviceCenters={[serviceCenter]}
                  selectedCenterId={serviceCenter.id}
                  radiusKm={0}
                  hideBookButton={true}
                  hideUserMarker={true}
                />
              </div>
            ) : (
              <div
                data-testid="missing-coordinates-fallback"
                className="w-full min-h-[320px] lg:min-h-[420px] rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-wide">
                    Facility Location Offline
                  </h3>
                  <p className="text-sm font-semibold text-amber-300">
                    Map location is not available for this service center.
                  </p>
                  <p className="text-xs text-slate-400">
                    GPS coordinates (latitude/longitude) have not been calibrated in FleetOps telemetry for {centerName}. Physical dispatch remains available at the verified facility address below.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 max-w-sm w-full text-left space-y-1">
                  <div className="font-bold text-white">{centerName}</div>
                  <div className="text-slate-400">{centerAddress}, {centerCity}</div>
                  <div className="text-slate-400">Direct Line: {centerPhone}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Facility Specifications & Bay Assignment (4 cols on desktop) */}
          <div className="lg:col-span-4 w-full space-y-4">
            {/* Facility Telemetry Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Oswald'] flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  Facility Telemetry
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ONLINE
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Facility Name</span>
                  <p className="text-sm font-bold text-white mt-0.5">{centerName}</p>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Physical Address</span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{centerAddress}</p>
                  <p className="text-slate-400">{centerCity}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Latitude</span>
                    <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                      {hasValidCoordinates ? centerLat.toFixed(5) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Longitude</span>
                    <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                      {hasValidCoordinates ? centerLng.toFixed(5) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Direct Dispatch Phone</span>
                  <p className="text-slate-300 font-mono mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>{centerPhone}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Mechanic Bay Assignment Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Oswald'] flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-400" />
                Technician Station
              </h3>

              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned Mechanic</span>
                  <span className="font-bold text-white">{profile?.name || currentUser?.name || 'Technician'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Badge ID</span>
                  <span className="font-mono text-amber-400 font-bold">{profile?.badgeNumber || 'TECH-BAY'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Availability</span>
                  <span className="text-emerald-400 font-bold">{profile?.availability || 'AVAILABLE'}</span>
                </div>
                {profile?.shiftName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Shift</span>
                    <span className="text-slate-300 text-[11px]">{profile.shiftName}</span>
                  </div>
                )}
              </div>

              {hasValidCoordinates && (
                <div className="text-[11px] text-slate-400 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Interactive OpenStreetMap/CARTO map enabled. Zoom and pan controls are operational.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface MechanicServiceCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  profile?: MechanicProfile | null;
  assignedCenter?: ServiceCenter | null;
  onNavigateFullView?: () => void;
}

export const MechanicServiceCenterModal: React.FC<MechanicServiceCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  profile,
  assignedCenter,
  onNavigateFullView
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="mechanic-service-center-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden">
        {onNavigateFullView && (
          <div className="absolute top-5 right-14 z-10 hidden sm:block">
            <button
              type="button"
              onClick={onNavigateFullView}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Page View</span>
            </button>
          </div>
        )}

        <MechanicServiceCenterView
          currentUser={currentUser}
          profile={profile}
          assignedCenter={assignedCenter}
          onClose={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
};
