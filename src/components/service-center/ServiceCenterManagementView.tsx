import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Search,
  PlusCircle,
  MapPin,
  Phone,
  DollarSign,
  Star,
  Activity,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle2,
  XCircle,
  BarChart3,
  Map as MapIcon,
  LayoutGrid,
  X,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import { ServiceCenter } from '../../types.ts';
import { ServiceCenterDashboardView } from './ServiceCenterDashboardView.tsx';
import { ServiceCenterMap } from './ServiceCenterMap.tsx';

interface ServiceCenterManagementViewProps {
  token?: string | null;
  onNavigateToBookings?: () => void;
}

export const ServiceCenterManagementView: React.FC<ServiceCenterManagementViewProps> = ({
  token
}) => {
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [selectedCenterForAnalytics, setSelectedCenterForAnalytics] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'MAP'>('GRID');

  // New Garage Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newGarageForm, setNewGarageForm] = useState({
    name: '',
    address: '',
    city: '',
    state: 'CA',
    latitude: 37.7749,
    longitude: -122.4194,
    phone: '',
    email: '',
    capacity: 6,
    pricePerHour: 85,
    operatingHours: 'Mon-Sat: 8:00 AM - 6:00 PM',
    services: 'Oil Change, Brake Inspection, Tire Rotation, Engine Diagnostics'
  });

  const fetchServiceCenters = async () => {
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem('fleetops_token') || localStorage.getItem('token');
      const res = await fetch('/api/admin/service-centers', {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });
      const json = await res.json();
      const list = json.serviceCenters || json.data || (Array.isArray(json) ? json : []);
      if (Array.isArray(list)) {
        // Map backend schema fields to frontend fields seamlessly
        const normalized = list.map((c: any) => ({
          ...c,
          services: c.services || c.specialties || ['General Service', 'Diagnostics'],
          status: c.status || c.workingStatus || 'ACTIVE',
          capacity: c.capacity || c.availableMechanics || 6,
          rating: c.rating !== undefined ? c.rating : (c.averageRating !== undefined ? c.averageRating : 4.8),
          pricePerHour: c.pricePerHour || 85,
          phone: c.phone || c.phoneNumber || '(555) 432-8765'
        }));
        setServiceCenters(normalized);
      }
    } catch (err) {
      console.error('Failed to fetch service centers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceCenters();
  }, []);

  // Toggle verification status
  const handleToggleVerification = async (center: ServiceCenter) => {
    const nextStatus = !center.isVerified;
    try {
      const activeToken = token || localStorage.getItem('fleetops_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/service-centers/${center.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({ isVerified: nextStatus })
      });
      if (res.ok) {
        setServiceCenters((prev) =>
          prev.map((c) => (c.id === center.id ? { ...c, isVerified: nextStatus } : c))
        );
      } else {
        const errJson = await res.json();
        alert(errJson.message || 'Failed to update verification status');
      }
    } catch (err: any) {
      console.error('Failed to update verification status:', err);
      alert(err.message || 'Failed to update verification status');
    }
  };

  // Update operating status
  const handleStatusChange = async (centerId: string, newStatus: string) => {
    try {
      const activeToken = token || localStorage.getItem('fleetops_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/service-centers/${centerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({ workingStatus: newStatus, status: newStatus })
      });
      if (res.ok) {
        setServiceCenters((prev) =>
          prev.map((c) => (c.id === centerId ? { ...c, status: newStatus, workingStatus: newStatus as any } : c))
        );
      } else {
        const errJson = await res.json();
        alert(errJson.message || 'Failed to update garage status');
      }
    } catch (err: any) {
      console.error('Failed to update operating status:', err);
      alert(err.message || 'Failed to update garage status');
    }
  };

  // Delete service center
  const handleDeleteServiceCenter = async (centerId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from FleetOps?`)) return;
    try {
      const activeToken = token || localStorage.getItem('fleetops_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/service-centers/${centerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });
      if (res.ok) {
        setServiceCenters((prev) => prev.filter((c) => c.id !== centerId));
      } else {
        const errJson = await res.json();
        alert(errJson.message || 'Failed to delete service center');
      }
    } catch (err: any) {
      console.error('Failed to delete service center:', err);
      alert(err.message || 'Failed to delete service center');
    }
  };

  // Create new service center
  const handleCreateServiceCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const activeToken = token || localStorage.getItem('fleetops_token') || localStorage.getItem('token');
      const serviceArray = newGarageForm.services
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/service-centers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          ...newGarageForm,
          phoneNumber: newGarageForm.phone,
          latitude: Number(newGarageForm.latitude),
          longitude: Number(newGarageForm.longitude),
          capacity: Number(newGarageForm.capacity),
          availableMechanics: Number(newGarageForm.capacity),
          pricePerHour: Number(newGarageForm.pricePerHour),
          services: serviceArray,
          specialties: serviceArray
        })
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.message || 'Failed to register service center');
      } else {
        setIsAddModalOpen(false);
        setNewGarageForm({
          name: '',
          address: '',
          city: '',
          state: 'CA',
          latitude: 37.7749,
          longitude: -122.4194,
          phone: '',
          email: '',
          capacity: 6,
          pricePerHour: 85,
          operatingHours: 'Mon-Sat: 8:00 AM - 6:00 PM',
          services: 'Oil Change, Brake Inspection, Tire Rotation, Engine Diagnostics'
        });
        await fetchServiceCenters();
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary statistics
  const totalGarages = serviceCenters.length;
  const verifiedGarages = serviceCenters.filter((c) => c.isVerified).length;
  const totalBays = serviceCenters.reduce((sum, c) => sum + (c.capacity || 4), 0);
  const avgRating = totalGarages > 0
    ? (serviceCenters.reduce((sum, c) => sum + (c.rating || 4.5), 0) / totalGarages).toFixed(1)
    : '0.0';

  // Filtered centers
  const filteredCenters = useMemo(() => {
    return serviceCenters.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.services.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || c.status?.toUpperCase() === statusFilter.toUpperCase();

      const matchesVerification =
        verificationFilter === 'ALL' ||
        (verificationFilter === 'VERIFIED' && c.isVerified) ||
        (verificationFilter === 'PENDING' && !c.isVerified);

      return matchesSearch && matchesStatus && matchesVerification;
    });
  }, [serviceCenters, searchTerm, statusFilter, verificationFilter]);

  // If viewing deep analytics of a center
  if (selectedCenterForAnalytics) {
    return (
      <ServiceCenterDashboardView
        centerId={selectedCenterForAnalytics}
        onBack={() => setSelectedCenterForAnalytics(null)}
        token={token}
      />
    );
  }

  return (
    <div className="space-y-6" id="service-center-management-view">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-['Oswald'] uppercase tracking-wider">
                Service Center Management Hub
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Admin control plane for nationwide bay telemetry & certified partner garages
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid List View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MAP')}
              className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'MAP'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Fleet Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
          </div>

          {/* Add Garage Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 font-['Oswald'] uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Garage</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase">Registered Garages</p>
            <p className="text-2xl font-black text-white font-['Oswald'] mt-0.5">{totalGarages}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase">Verified Garages</p>
            <p className="text-2xl font-black text-emerald-400 font-['Oswald'] mt-0.5">
              {verifiedGarages} <span className="text-xs text-slate-500">/ {totalGarages}</span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase">Total Hydraulic Bays</p>
            <p className="text-2xl font-black text-amber-400 font-['Oswald'] mt-0.5">{totalBays}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono text-slate-400 uppercase">System Avg Rating</p>
            <p className="text-2xl font-black text-white font-['Oswald'] mt-0.5 flex items-center gap-1">
              <span>{avgRating}</span>
              <span className="text-amber-400 text-sm">★</span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search garage, city, or service..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="BUSY">BUSY</option>
              <option value="FULL">FULL</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verification:</span>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
            >
              <option value="ALL">All Centers</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="PENDING">Pending Verification</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchServiceCenters}
            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reload data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content: Map or Grid View */}
      {viewMode === 'MAP' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-['Oswald'] uppercase tracking-wider flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-amber-500" />
              Interactive Nationwide Service Center Fleet Map
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Showing {filteredCenters.length} Garages
            </span>
          </div>

          <div className="h-[520px] rounded-xl overflow-hidden border border-slate-800">
            <ServiceCenterMap
              userLat={37.7749}
              userLng={-122.4194}
              serviceCenters={filteredCenters}
              selectedCenterId={null}
              onSelectCenter={(c) => setSelectedCenterForAnalytics(c.id)}
              onBookService={(c) => setSelectedCenterForAnalytics(c.id)}
              radiusKm={100}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCenters.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-300">No Service Centers Found</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Try adjusting your search criteria or register a new service center.
              </p>
            </div>
          ) : (
            filteredCenters.map((center) => (
              <div
                key={center.id}
                id={`admin-service-center-${center.id}`}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-wide group-hover:text-amber-400 transition-colors">
                        {center.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{center.address}, {center.city}, {center.state}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleVerification(center)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                        center.isVerified
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                      title="Click to toggle verification status"
                    >
                      {center.isVerified ? (
                        <>
                          <ShieldCheck className="w-3 h-3" />
                          <span>VERIFIED</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3 h-3" />
                          <span>UNVERIFIED</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Badges & Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                      <p className="text-[9px] font-mono text-slate-500 uppercase">Rating</p>
                      <p className="text-xs font-bold text-amber-400 font-mono mt-0.5 flex items-center justify-center gap-0.5">
                        <span>★</span>
                        <span>{center.rating?.toFixed(1) || '4.8'}</span>
                      </p>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                      <p className="text-[9px] font-mono text-slate-500 uppercase">Bays</p>
                      <p className="text-xs font-bold text-slate-200 font-mono mt-0.5">
                        {center.capacity || 6}
                      </p>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                      <p className="text-[9px] font-mono text-slate-500 uppercase">Rate</p>
                      <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                        ${center.pricePerHour}/hr
                      </p>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center justify-between mt-3 text-xs font-mono">
                    <span className="text-slate-400">Operating Bay Status:</span>
                    <select
                      value={center.status || 'ACTIVE'}
                      onChange={(e) => handleStatusChange(center.id, e.target.value)}
                      className={`bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold cursor-pointer ${
                        center.status === 'ACTIVE'
                          ? 'text-emerald-400'
                          : center.status === 'BUSY'
                          ? 'text-amber-400'
                          : center.status === 'FULL'
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="BUSY">BUSY</option>
                      <option value="FULL">FULL</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  {/* Services pills */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {center.services.slice(0, 3).map((srv, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-300"
                        >
                          {srv}
                        </span>
                      ))}
                      {center.services.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-500">
                          +{center.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCenterForAnalytics(center.id)}
                    className="flex-1 px-3 py-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer group/btn"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-amber-500 group-hover/btn:text-slate-950" />
                    <span>View Analytics</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteServiceCenter(center.id, center.name)}
                    className="p-2 bg-slate-950 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-colors cursor-pointer"
                    title="Delete Service Center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Register New Service Center Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-wider">
                  Register New Service Center
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateServiceCenter} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Service Center Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGarageForm.name}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, name: e.target.value })}
                    placeholder="e.g. Apex High-Performance Auto Bay"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGarageForm.address}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, address: e.target.value })}
                    placeholder="e.g. 742 Evergreen Terrace"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGarageForm.city}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, city: e.target.value })}
                    placeholder="e.g. San Francisco"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGarageForm.state}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, state: e.target.value })}
                    placeholder="e.g. CA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Latitude Coordinates *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newGarageForm.latitude}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, latitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Longitude Coordinates *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newGarageForm.longitude}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, longitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Phone Contact *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGarageForm.phone}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, phone: e.target.value })}
                    placeholder="e.g. (555) 432-8765"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Email Contact
                  </label>
                  <input
                    type="email"
                    value={newGarageForm.email}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, email: e.target.value })}
                    placeholder="dispatch@garage.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Hydraulic Bays (Capacity)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newGarageForm.capacity}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Labor Rate ($ / hr)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="500"
                    value={newGarageForm.pricePerHour}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, pricePerHour: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Certified Services (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={newGarageForm.services}
                    onChange={(e) => setNewGarageForm({ ...newGarageForm, services: e.target.value })}
                    placeholder="Oil Change, Brake Pad Replacement, Engine Tuneup"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-['Oswald'] uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
