import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  Search,
  Plus,
  Filter,
  Layers,
  Fuel,
  Zap,
  Gauge,
  Calendar,
  ShieldCheck,
  Building2,
  Trash2,
  Edit,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Globe,
  Settings,
  BatteryCharging,
  Cpu,
  ChevronRight,
  Download,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { Vehicle, User, VehicleFleetStats } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import {
  GLOBAL_VEHICLE_DATABASE,
  VEHICLE_CATEGORIES,
  VehicleCompanyRecord,
  VehicleModelSpec
} from '../../data/vehicleDatabase.ts';
import { AddVehicleModal } from '../AddVehicleModal.tsx';

interface AdminVehicleDatabaseViewProps {
  vehicles: Vehicle[];
  user: User;
  onVehicleUpdated?: (vehicle: Vehicle) => void;
  onVehicleDeleted?: (vehicleId: string) => void;
  onVehicleAdded?: (vehicle: Vehicle) => void;
}

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'];

export const AdminVehicleDatabaseView: React.FC<AdminVehicleDatabaseViewProps> = ({
  vehicles = [],
  user,
  onVehicleUpdated,
  onVehicleDeleted,
  onVehicleAdded
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'FLEET' | 'CATALOG' | 'ANALYTICS'>('FLEET');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [fuelFilter, setFuelFilter] = useState<string>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');

  // Catalog tab filter
  const [catalogLetter, setCatalogLetter] = useState<string>('ALL');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [customCatalog, setCustomCatalog] = useState<VehicleCompanyRecord[]>(GLOBAL_VEHICLE_DATABASE);

  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<Vehicle | null>(null);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState<boolean>(false);
  const [isAddModelOpen, setIsAddModelOpen] = useState<boolean>(false);
  const [selectedCompanyForNewModel, setSelectedCompanyForNewModel] = useState<string>('Toyota');

  // New Company Form State
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newCompanyCountry, setNewCompanyCountry] = useState<string>('');
  const [newCompanyCategory, setNewCompanyCategory] = useState<string>('Cars');

  // New Model Form State
  const [newModelName, setNewModelName] = useState<string>('');
  const [newModelType, setNewModelType] = useState<string>('Cars');
  const [newModelFuel, setNewModelFuel] = useState<string>('Petrol');
  const [newModelTransmission, setNewModelTransmission] = useState<string>('Automatic');
  const [newModelBattery, setNewModelBattery] = useState<string>('');
  const [newModelRange, setNewModelRange] = useState<string>('');

  // Status & Notification feedback
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fleetStats, setFleetStats] = useState<VehicleFleetStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  // Fetch catalog & stats
  const refreshData = async () => {
    try {
      setIsLoadingStats(true);
      const [catRes, statsRes] = await Promise.all([
        apiClient.getVehicleCatalog().catch(() => ({ catalog: GLOBAL_VEHICLE_DATABASE })),
        apiClient.getVehicleStats().catch(() => ({ stats: null }))
      ]);

      if (catRes && catRes.catalog) {
        setCustomCatalog(catRes.catalog);
      }
      if (statsRes && statsRes.stats) {
        setFleetStats(statsRes.stats);
      }
    } catch (err) {
      console.warn('Error refreshing catalog:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filter registered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const brand = (v.company || v.brand || '').toLowerCase();
      const model = (v.model || '').toLowerCase();
      const reg = (v.registrationNumber || '').toLowerCase();
      const engine = (v.engineNumber || '').toLowerCase();
      const chassis = (v.chassisNumber || '').toLowerCase();
      const cat = (v.category || v.vehicleType || '').toLowerCase();
      const fuel = (v.fuelType || '').toLowerCase();

      const matchesCat = categoryFilter === 'ALL' || (v.category || v.vehicleType || '').toUpperCase() === categoryFilter.toUpperCase();
      const matchesFuel = fuelFilter === 'ALL' || (v.fuelType || '').toUpperCase() === fuelFilter.toUpperCase();
      const matchesCompany = companyFilter === 'ALL' || (v.company || v.brand || '').toUpperCase() === companyFilter.toUpperCase();

      if (!searchQuery.trim()) return matchesCat && matchesFuel && matchesCompany;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        brand.includes(q) ||
        model.includes(q) ||
        reg.includes(q) ||
        engine.includes(q) ||
        chassis.includes(q) ||
        cat.includes(q) ||
        fuel.includes(q);

      return matchesCat && matchesFuel && matchesCompany && matchesSearch;
    });
  }, [vehicles, searchQuery, categoryFilter, fuelFilter, companyFilter]);

  // Filter Catalog A-Z
  const filteredCatalog = useMemo(() => {
    return customCatalog.filter((c) => {
      const matchLetter =
        catalogLetter === 'ALL' ||
        c.company.toUpperCase().startsWith(catalogLetter.toUpperCase());

      if (!catalogSearch.trim()) return matchLetter;
      const q = catalogSearch.trim().toLowerCase();
      const matchSearch =
        c.company.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.vehicles.some((m) => m.model.toLowerCase().includes(q) || m.type.toLowerCase().includes(q));

      return matchLetter && matchSearch;
    });
  }, [customCatalog, catalogLetter, catalogSearch]);

  // Computed metrics
  const totalCount = vehicles.length;
  const evCount = vehicles.filter(
    (v) => (v.fuelType || '').toLowerCase().includes('electric') || (v.vehicleType || '').toLowerCase().includes('ev')
  ).length;
  const hybridCount = vehicles.filter((v) => (v.fuelType || '').toLowerCase().includes('hybrid')).length;
  const avgHealth = totalCount > 0 ? Math.round(vehicles.reduce((acc, v) => acc + (v.healthScore ?? 95), 0) / totalCount) : 100;

  // Handler: Add New Vehicle
  const handleRegisterVehicle = async (data: Partial<Vehicle>) => {
    try {
      const created = await apiClient.addVehicle(data);
      if (onVehicleAdded && created) onVehicleAdded(created);
      setNotification({ type: 'success', message: `Vehicle ${data.company} ${data.model} (${data.registrationNumber}) registered successfully!` });
      refreshData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to add vehicle' });
    }
  };

  // Handler: Update Vehicle
  const handleSaveEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    try {
      const updated = await apiClient.updateVehicle(editingVehicle.id, editingVehicle);
      if (onVehicleUpdated && updated) onVehicleUpdated(updated);
      setEditingVehicle(null);
      setNotification({ type: 'success', message: `Vehicle ${editingVehicle.registrationNumber} updated successfully!` });
      refreshData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update vehicle' });
    }
  };

  // Handler: Delete Vehicle
  const handleDeleteVehicle = async (id: string, reg: string) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${reg}? This action cannot be undone.`)) return;

    try {
      await apiClient.deleteVehicle(id);
      if (onVehicleDeleted) onVehicleDeleted(id);
      setNotification({ type: 'success', message: `Vehicle ${reg} removed from fleet database.` });
      refreshData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete vehicle' });
    }
  };

  // Handler: Add Company to Catalog
  const handleAddCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    try {
      await apiClient.addCatalogCompany({
        company: newCompanyName.trim(),
        country: newCompanyCountry.trim() || 'Global',
        category: newCompanyCategory
      });
      setIsAddCompanyOpen(false);
      setNewCompanyName('');
      setNewCompanyCountry('');
      setNotification({ type: 'success', message: `Manufacturer ${newCompanyName} added to Global Vehicle Catalog!` });
      refreshData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to add company' });
    }
  };

  // Handler: Add Model to Company
  const handleAddModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim()) return;

    try {
      await apiClient.addCatalogModel({
        company: selectedCompanyForNewModel,
        model: newModelName.trim(),
        type: newModelType,
        fuel: [newModelFuel],
        transmissions: [newModelTransmission],
        defaultBatteryCapacity: newModelBattery ? Number(newModelBattery) : undefined,
        defaultRange: newModelRange ? Number(newModelRange) : undefined
      });
      setIsAddModelOpen(false);
      setNewModelName('');
      setNotification({ type: 'success', message: `Model ${newModelName} added to ${selectedCompanyForNewModel} in catalog!` });
      refreshData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to add model' });
    }
  };

  // Prepare chart data
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach((v) => {
      const c = v.category || v.vehicleType || 'Cars';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  const fuelChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach((v) => {
      const f = v.fuelType || 'Petrol';
      counts[f] = (counts[f] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Sub-tab navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-['Oswald'] uppercase tracking-wide text-white flex items-center gap-2">
                Vehicle Database Management
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400">
                  Global A-Z Directory
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized global vehicle catalog, enterprise fleet telemetry, and full technical specifications.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
            <button
              onClick={() => setActiveSubTab('FLEET')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeSubTab === 'FLEET'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fleet Directory ({vehicles.length})
            </button>
            <button
              onClick={() => setActiveSubTab('CATALOG')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeSubTab === 'CATALOG'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              A-Z Catalog ({customCatalog.length} Brands)
            </button>
            <button
              onClick={() => setActiveSubTab('ANALYTICS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeSubTab === 'ANALYTICS'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fleet Statistics
            </button>
          </div>

          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 font-['Oswald'] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vehicle</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Bento */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span>Total Fleet Vehicles</span>
            <Car className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-['Oswald'] text-white mt-1.5">{totalCount}</p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Across {new Set(vehicles.map((v) => v.company || v.brand)).size} distinct manufacturers</p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span>Clean Energy (EV & Hybrid)</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-['Oswald'] text-emerald-400 mt-1.5">
            {evCount + hybridCount} <span className="text-xs text-slate-400 font-mono font-normal">({evCount} EV / {hybridCount} Hybrid)</span>
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            {totalCount > 0 ? Math.round(((evCount + hybridCount) / totalCount) * 100) : 0}% fleet electrification
          </p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span>Avg Fleet Health Score</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-['Oswald'] text-amber-400 mt-1.5">{avgHealth}%</p>
          <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Fleet diagnostic condition optimal</p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span>Global Brand Catalog</span>
            <Globe className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold font-['Oswald'] text-sky-400 mt-1.5">{customCatalog.length} Brands</p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">19+ Vehicle Classifications active</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: REGISTERED FLEET VEHICLES */}
      {/* ========================================================================= */}
      {activeSubTab === 'FLEET' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Plate, Make, Model, Engine No, or Chassis / VIN..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Categories ({VEHICLE_CATEGORIES.length})</option>
                {VEHICLE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Fuel Filter */}
              <select
                value={fuelFilter}
                onChange={(e) => setFuelFilter(e.target.value)}
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Fuel Types</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric (EV)</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
                <option value="Hydrogen">Hydrogen</option>
              </select>

              {(searchQuery || categoryFilter !== 'ALL' || fuelFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('ALL');
                    setFuelFilter('ALL');
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-mono flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 border-t border-slate-850 pt-2 px-1">
              <span>
                Displaying <strong className="text-amber-400">{filteredVehicles.length}</strong> matching records out of{' '}
                <strong className="text-white">{vehicles.length}</strong> total registered vehicles.
              </span>
            </div>
          </div>

          {/* Vehicle Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Vehicle / Model</th>
                    <th className="px-4 py-3.5">Registration (Plate)</th>
                    <th className="px-4 py-3.5">Category & Fuel</th>
                    <th className="px-4 py-3.5">Serial Identifiers (Engine / VIN)</th>
                    <th className="px-4 py-3.5">Odometer & Health</th>
                    <th className="px-4 py-3.5">30-Day Reminder</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        <Car className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-slate-400 font-['Oswald'] uppercase text-sm">No vehicles found</p>
                        <p className="text-xs text-slate-600 mt-1">Try adjusting search filters or register a new fleet vehicle.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v) => {
                      const health = v.healthScore ?? 95;
                      return (
                        <tr key={v.id} className="hover:bg-slate-900/60 transition-colors">
                          {/* Vehicle / Model */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-amber-400 font-['Oswald'] shrink-0">
                                {(v.company || v.brand || 'V').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-white block">
                                  {v.company || v.brand} {v.model}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {v.manufacturingYear || v.year} • {v.variant || 'Standard'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Registration */}
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[11px] tracking-wider">
                              {v.registrationNumber}
                            </span>
                          </td>

                          {/* Category & Fuel */}
                          <td className="px-4 py-3.5">
                            <div>
                              <span className="font-semibold text-slate-200 block">{v.category || v.vehicleType || 'Car'}</span>
                              <span className="text-[10px] text-slate-400">{v.fuelType || 'Petrol'} • {v.transmission || 'Auto'}</span>
                            </div>
                          </td>

                          {/* Serial Numbers */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5 text-[10px]">
                              <div>
                                <span className="text-slate-500">ENG: </span>
                                <span className="text-slate-300 font-semibold">{v.engineNumber || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">VIN: </span>
                                <span className="text-slate-300 font-semibold">{v.chassisNumber || 'N/A'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Odometer & Health */}
                          <td className="px-4 py-3.5">
                            <div>
                              <span className="text-slate-300 block font-semibold">{(v.mileage || 0).toLocaleString()} mi</span>
                              <span className={`text-[10px] font-bold ${health >= 85 ? 'text-emerald-400' : health >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                                Health: {health}%
                              </span>
                            </div>
                          </td>

                          {/* Reminder Status */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                v.reminderStatus === 'OVERDUE'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : v.reminderStatus === 'DUE_SOON'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {v.reminderStatus || 'OK'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedVehicleDetails(v)}
                                title="View Complete Specs Sheet"
                                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingVehicle(v)}
                                title="Edit Vehicle Record"
                                className="p-1.5 rounded-lg bg-slate-900 text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteVehicle(v.id, v.registrationNumber)}
                                title="Delete Vehicle Record"
                                className="p-1.5 rounded-lg bg-slate-900 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: A-Z MANUFACTURER CATALOG */}
      {/* ========================================================================= */}
      {activeSubTab === 'CATALOG' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search manufacturer brands, countries, or specific models worldwide..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddCompanyOpen(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Company</span>
                </button>
                <button
                  onClick={() => setIsAddModelOpen(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Model</span>
                </button>
              </div>
            </div>

            {/* A-Z Letter Selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono font-bold">
              {['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')].map((letter) => (
                <button
                  key={letter}
                  onClick={() => setCatalogLetter(letter)}
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                    catalogLetter === letter
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Company Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((co) => (
              <div key={co.company} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-['Oswald'] text-sm">
                        {co.company.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white font-['Oswald'] uppercase text-base">{co.company}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{co.country} • {co.category}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 font-semibold">
                      {co.vehicles.length} Model{co.vehicles.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Models list pill tag cloud */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {co.vehicles.slice(0, 6).map((m) => (
                      <span
                        key={m.model}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1"
                      >
                        <span>{m.model}</span>
                        <span className="text-amber-500/80 font-bold">[{m.fuel[0] || 'ICE'}]</span>
                      </span>
                    ))}
                    {co.vehicles.length > 6 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                        +{co.vehicles.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <button
                    onClick={() => {
                      setSelectedCompanyForNewModel(co.company);
                      setIsAddModelOpen(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Model
                  </button>
                  <span className="text-[10px] text-slate-600">Worldwide Database Spec</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: FLEET ANALYTICS & VISUAL CHARTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'ANALYTICS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution Chart */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold font-['Oswald'] uppercase tracking-wide text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              Fleet Composition By Vehicle Category
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#090D16', border: '1px solid #1E293B', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fuel / Propulsion Distribution */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold font-['Oswald'] uppercase tracking-wide text-white flex items-center gap-2">
              <Fuel className="w-4 h-4 text-emerald-400" />
              Fuel & Powertrain Electrification Breakdown
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelChartData}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} fontFamily="monospace" />
                  <YAxis stroke="#64748B" fontSize={10} fontFamily="monospace" />
                  <Tooltip contentStyle={{ backgroundColor: '#090D16', border: '1px solid #1E293B', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }} />
                  <Bar dataKey="value" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD VEHICLE MODAL */}
      {/* ========================================================================= */}
      {isAddVehicleOpen && (
        <AddVehicleModal
          isOpen={isAddVehicleOpen}
          onClose={() => setIsAddVehicleOpen(false)}
          onAddVehicle={handleRegisterVehicle}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT VEHICLE MODAL */}
      {/* ========================================================================= */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-white font-['Oswald'] uppercase">
                  Edit Vehicle: {editingVehicle.registrationNumber}
                </h3>
              </div>
              <button onClick={() => setEditingVehicle(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVehicle} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Company / Make</label>
                  <input
                    type="text"
                    value={editingVehicle.company || editingVehicle.brand}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, company: e.target.value, brand: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Model Name</label>
                  <input
                    type="text"
                    value={editingVehicle.model}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Variant / Trim</label>
                  <input
                    type="text"
                    value={editingVehicle.variant || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, variant: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={editingVehicle.manufacturingYear || editingVehicle.year}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, manufacturingYear: Number(e.target.value), year: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Fuel Type</label>
                  <select
                    value={editingVehicle.fuelType || 'Petrol'}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, fuelType: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                    <option value="Hydrogen">Hydrogen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Engine Number</label>
                  <input
                    type="text"
                    value={editingVehicle.engineNumber || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, engineNumber: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Chassis Number / VIN</label>
                  <input
                    type="text"
                    value={editingVehicle.chassisNumber || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, chassisNumber: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Odometer (mi)</label>
                  <input
                    type="number"
                    value={editingVehicle.mileage || 0}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, mileage: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Health Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingVehicle.healthScore ?? 95}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, healthScore: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl font-['Oswald'] uppercase tracking-wider"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW VEHICLE DETAIL SPEC SHEET */}
      {/* ========================================================================= */}
      {selectedVehicleDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base font-['Oswald'] uppercase">
                  Technical Specifications Sheet: {selectedVehicleDetails.registrationNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedVehicleDetails(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Make / Company</p>
                <p className="font-bold text-white mt-0.5">{selectedVehicleDetails.company || selectedVehicleDetails.brand}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Model</p>
                <p className="font-bold text-white mt-0.5">{selectedVehicleDetails.model}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Variant / Trim</p>
                <p className="font-bold text-white mt-0.5">{selectedVehicleDetails.variant || 'Standard'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Category</p>
                <p className="font-bold text-amber-400 mt-0.5">{selectedVehicleDetails.category || selectedVehicleDetails.vehicleType || 'Car'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Fuel Type</p>
                <p className="font-bold text-white mt-0.5">{selectedVehicleDetails.fuelType || 'Petrol'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Transmission</p>
                <p className="font-bold text-white mt-0.5">{selectedVehicleDetails.transmission || 'Automatic'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Manufacture Year</p>
                <p className="font-bold text-white mt-0.5">{selectedVehicleDetails.manufacturingYear || selectedVehicleDetails.year}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Current Odometer</p>
                <p className="font-bold text-white mt-0.5">{(selectedVehicleDetails.mileage || 0).toLocaleString()} mi</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Health Score</p>
                <p className="font-bold text-emerald-400 mt-0.5">{selectedVehicleDetails.healthScore ?? 95}%</p>
              </div>
              <div className="col-span-3">
                <p className="text-[10px] text-slate-500 uppercase">Engine Number</p>
                <p className="font-bold text-slate-200 mt-0.5">{selectedVehicleDetails.engineNumber || 'None Recorded'}</p>
              </div>
              <div className="col-span-3">
                <p className="text-[10px] text-slate-500 uppercase">Chassis Number / VIN</p>
                <p className="font-bold text-slate-200 mt-0.5">{selectedVehicleDetails.chassisNumber || 'None Recorded'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedVehicleDetails(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold font-mono"
              >
                Close Spec Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD COMPANY TO CATALOG */}
      {/* ========================================================================= */}
      {isAddCompanyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base font-['Oswald'] uppercase text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                Add Vehicle Company
              </h3>
              <button onClick={() => setIsAddCompanyOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompanySubmit} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Company Name</label>
                <input
                  required
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Lucid Motors"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Country of Origin</label>
                <input
                  type="text"
                  value={newCompanyCountry}
                  onChange={(e) => setNewCompanyCountry(e.target.value)}
                  placeholder="e.g. United States"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Primary Category</label>
                <select
                  value={newCompanyCategory}
                  onChange={(e) => setNewCompanyCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  {VEHICLE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl font-['Oswald'] uppercase tracking-wider"
                >
                  Save Manufacturer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MODEL TO CATALOG */}
      {/* ========================================================================= */}
      {isAddModelOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base font-['Oswald'] uppercase text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-500" />
                Add Model to Manufacturer
              </h3>
              <button onClick={() => setIsAddModelOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddModelSubmit} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Target Manufacturer</label>
                <select
                  value={selectedCompanyForNewModel}
                  onChange={(e) => setSelectedCompanyForNewModel(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  {customCatalog.map((co) => (
                    <option key={co.company} value={co.company}>
                      {co.company} ({co.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Model Name</label>
                <input
                  required
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="e.g. Gravity SUV"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Classification</label>
                  <select
                    value={newModelType}
                    onChange={(e) => setNewModelType(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    {VEHICLE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Fuel Type</label>
                  <select
                    value={newModelFuel}
                    onChange={(e) => setNewModelFuel(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                    <option value="Hydrogen">Hydrogen</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModelOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl font-['Oswald'] uppercase tracking-wider"
                >
                  Save Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
