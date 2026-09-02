import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Car,
  Search,
  Fuel,
  Zap,
  Gauge,
  Calendar,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Layers,
  Settings,
  BatteryCharging,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  GLOBAL_VEHICLE_DATABASE,
  VEHICLE_CATEGORIES,
  VehicleCompanyRecord,
  VehicleModelSpec
} from '../data/vehicleDatabase.ts';
import { Vehicle } from '../types.ts';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: (vehicleData: Partial<Vehicle>) => void;
}

const COLOR_PRESETS = [
  { name: 'Pearl White', hex: '#F8FAFC' },
  { name: 'Midnight Black', hex: '#0F172A' },
  { name: 'Graphite Grey', hex: '#475569' },
  { name: 'Silver Metallic', hex: '#94A3B8' },
  { name: 'Apex Amber / Gold', hex: '#F59E0B' },
  { name: 'Royal Crimson Red', hex: '#DC2626' },
  { name: 'Deep Sapphire Blue', hex: '#2563EB' },
  { name: 'British Racing Green', hex: '#16A34A' }
];

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ isOpen, onClose, onAddVehicle }) => {
  // Catalog & Selection State
  const [selectedCategory, setSelectedCategory] = useState<string>('Cars');
  const [selectedCompany, setSelectedCompany] = useState<string>('Toyota');
  const [companySearchQuery, setCompanySearchQuery] = useState<string>('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState<boolean>(false);

  const [selectedModel, setSelectedModel] = useState<string>('Camry');
  const [variant, setVariant] = useState<string>('Hybrid Luxury');
  const [fuelType, setFuelType] = useState<string>('Hybrid');
  const [transmission, setTransmission] = useState<string>('Automatic');
  const [manufacturingYear, setManufacturingYear] = useState<number>(new Date().getFullYear());
  
  // Registration & VIN specs
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [engineNumber, setEngineNumber] = useState<string>('');
  const [chassisNumber, setChassisNumber] = useState<string>('');
  const [color, setColor] = useState<string>('Pearl White');
  const [mileage, setMileage] = useState<number>(18500);

  // EV / Hybrid specifics
  const [batteryCapacity, setBatteryCapacity] = useState<number | undefined>(undefined);
  const [range, setRange] = useState<number | undefined>(undefined);

  // Error state
  const [formError, setFormError] = useState<string | null>(null);

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    const q = companySearchQuery.trim().toLowerCase();
    if (!q) return GLOBAL_VEHICLE_DATABASE;
    return GLOBAL_VEHICLE_DATABASE.filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [companySearchQuery]);

  // Current company record & models
  const currentCompanyRecord = useMemo(() => {
    return GLOBAL_VEHICLE_DATABASE.find(
      (c) => c.company.toLowerCase() === selectedCompany.toLowerCase()
    ) || GLOBAL_VEHICLE_DATABASE[0];
  }, [selectedCompany]);

  const availableModels: VehicleModelSpec[] = useMemo(() => {
    return currentCompanyRecord ? currentCompanyRecord.vehicles : [];
  }, [currentCompanyRecord]);

  // When company changes, pick first model and update defaults
  const handleCompanySelect = (companyName: string) => {
    setSelectedCompany(companyName);
    setIsCompanyDropdownOpen(false);
    setCompanySearchQuery('');

    const targetCompany = GLOBAL_VEHICLE_DATABASE.find((c) => c.company === companyName);
    if (targetCompany && targetCompany.vehicles.length > 0) {
      const firstModel = targetCompany.vehicles[0];
      setSelectedModel(firstModel.model);
      setSelectedCategory(firstModel.type || targetCompany.category || 'Cars');
      const defaultFuel = firstModel.fuel[0] || 'Petrol';
      setFuelType(defaultFuel);
      setTransmission(firstModel.transmissions?.[0] || 'Automatic');
      setBatteryCapacity(firstModel.defaultBatteryCapacity);
      setRange(firstModel.defaultRange);
    }
  };

  // When model changes, update defaults
  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
    const spec = availableModels.find((m) => m.model === modelName);
    if (spec) {
      if (spec.type) setSelectedCategory(spec.type);
      if (spec.fuel.length > 0) setFuelType(spec.fuel[0]);
      if (spec.transmissions && spec.transmissions.length > 0) setTransmission(spec.transmissions[0]);
      setBatteryCapacity(spec.defaultBatteryCapacity);
      setRange(spec.defaultRange);
    }
  };

  const isEVOrHybrid = fuelType === 'Electric' || fuelType === 'Hybrid' || selectedCategory.includes('Electric');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const reg = registrationNumber.trim().toUpperCase();
    if (!reg) {
      setFormError('Please enter a valid Registration Number / License Plate.');
      return;
    }

    if (!selectedCompany.trim()) {
      setFormError('Please select a vehicle manufacturer company.');
      return;
    }

    if (!selectedModel.trim()) {
      setFormError('Please select or specify a vehicle model.');
      return;
    }

    onAddVehicle({
      registrationNumber: reg,
      company: selectedCompany.trim(),
      brand: selectedCompany.trim(),
      model: selectedModel.trim(),
      variant: variant.trim() || 'Standard Spec',
      vehicleType: selectedCategory,
      category: selectedCategory,
      fuelType,
      transmission,
      manufacturingYear: Number(manufacturingYear),
      year: Number(manufacturingYear),
      engineNumber: engineNumber.trim() ? engineNumber.trim().toUpperCase() : undefined,
      chassisNumber: chassisNumber.trim() ? chassisNumber.trim().toUpperCase() : undefined,
      color: color.trim(),
      mileage: Number(mileage) || 0,
      batteryCapacity: isEVOrHybrid && batteryCapacity ? Number(batteryCapacity) : undefined,
      range: isEVOrHybrid && range ? Number(range) : undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100 animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Oswald'] uppercase tracking-wide text-white flex items-center gap-2">
                Register Fleet Vehicle
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400">
                  Global Database Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Select from worldwide A-Z vehicle manufacturers and configure complete technical specifications.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          {/* Top Live Preview Banner */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-inner">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-amber-400 shrink-0 font-['Oswald'] text-lg font-bold">
                {selectedCompany.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white font-['Oswald'] uppercase">
                    {selectedCompany} {selectedModel}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                    {manufacturingYear}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                  <span className="text-slate-300 font-semibold">{variant || 'Standard'}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{selectedCategory}</span>
                  <span>•</span>
                  <span>{fuelType}</span>
                  <span>•</span>
                  <span>{transmission}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimated Health</span>
                <span className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3.5 h-3.5" /> 98% Optimal
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 1: Manufacturer & Classification */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              1. Vehicle Category & A-Z Manufacturer
            </h3>

            {/* Vehicle Category Selector */}
            <div>
              <label className="block text-slate-300 font-mono font-semibold mb-1.5 uppercase tracking-wide">
                Vehicle Category Classification
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                {VEHICLE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Dropdown (Searchable A-Z) */}
              <div className="relative">
                <label className="block text-slate-300 font-mono font-semibold mb-1.5 uppercase tracking-wide">
                  Vehicle Manufacturer (A-Z Brands)
                </label>
                <div
                  onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {selectedCompany} ({currentCompanyRecord?.country || 'Global'})
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                {/* Company Search Popup */}
                {isCompanyDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-30 p-2 max-h-60 overflow-y-auto">
                    <div className="relative mb-2 sticky top-0 bg-slate-950 pb-1">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={companySearchQuery}
                        onChange={(e) => setCompanySearchQuery(e.target.value)}
                        placeholder="Search company (Audi, BMW, BYD, Tesla...)"
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-0.5">
                      {filteredCompanies.map((c) => (
                        <button
                          key={c.company}
                          type="button"
                          onClick={() => handleCompanySelect(c.company)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                            selectedCompany === c.company
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          <span>{c.company}</span>
                          <span className="text-[10px] opacity-75">{c.country}</span>
                        </button>
                      ))}
                      {filteredCompanies.length === 0 && (
                        <div className="p-3 text-center text-slate-500 text-xs font-mono">
                          No matching manufacturer found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Model Dropdown */}
              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1.5 uppercase tracking-wide">
                  Model (Auto-loaded for {selectedCompany})
                </label>
                {availableModels.length > 0 ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => handleModelSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  >
                    {availableModels.map((m) => (
                      <option key={m.model} value={m.model}>
                        {m.model} — [{m.type}] ({m.fuel.join('/')})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    placeholder="Enter custom model name"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Technical Specifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-amber-500" />
              2. Powertrain, Trim & Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1">Variant / Trim</label>
                <input
                  type="text"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  placeholder="e.g. Long Range, GT Line, VXi"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1">Fuel / Propulsion</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric (EV)</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="CNG">CNG</option>
                  <option value="LPG">LPG</option>
                  <option value="Hydrogen">Hydrogen FCEV</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1">Transmission</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                  <option value="Dual-Clutch">Dual-Clutch (DCT)</option>
                  <option value="CVT">CVT Continuously Variable</option>
                  <option value="Single-Speed">Single-Speed (EV Direct)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1">Manufacture Year</label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  value={manufacturingYear}
                  onChange={(e) => setManufacturingYear(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* EV Specific Specifications */}
            {isEVOrHybrid && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                <div>
                  <label className="block text-amber-300 font-mono font-semibold mb-1 flex items-center gap-1">
                    <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
                    Battery Capacity (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={batteryCapacity || ''}
                    onChange={(e) => setBatteryCapacity(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 78.1 kWh"
                    className="w-full p-2 bg-slate-950 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 font-mono font-semibold mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Certified EV Range (km)
                  </label>
                  <input
                    type="number"
                    value={range || ''}
                    onChange={(e) => setRange(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 520 km"
                    className="w-full p-2 bg-slate-950 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Legal Identifiers, Odometer & Color */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              3. Registration, Serial Numbers & Odometer
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1">
                  Registration Number (Plate) <span className="text-amber-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. DL-01-AX-9942"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold uppercase text-amber-400 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 tracking-wider"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1">Engine Number (Unique)</label>
                <input
                  type="text"
                  value={engineNumber}
                  onChange={(e) => setEngineNumber(e.target.value)}
                  placeholder="e.g. ENG-883921-AZ"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono uppercase text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1">Chassis Number / VIN</label>
                <input
                  type="text"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value)}
                  placeholder="e.g. 1HGCR2F83HA001928"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono uppercase text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1">
                  Current Odometer (Miles / Kilometers)
                </label>
                <div className="relative">
                  <Gauge className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-mono font-semibold mb-1">Exterior Finish & Color</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setColor(p.name)}
                      title={p.name}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === p.name ? 'border-amber-500 scale-110 shadow-md shadow-amber-500/20' : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: p.hex }}
                    />
                  ))}
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Custom color..."
                    className="flex-1 min-w-[120px] p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500 ml-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 font-['Oswald'] uppercase tracking-wider flex items-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Vehicle Registration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
