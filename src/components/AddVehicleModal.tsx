import React, { useState } from 'react';
import { X, Car } from 'lucide-react';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: (vehicleData: {
    registrationNumber: string;
    brand: string;
    model: string;
    year: number;
    vehicleType?: string;
  }) => void;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ isOpen, onClose, onAddVehicle }) => {
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [brand, setBrand] = useState<string>('Ford');
  const [model, setModel] = useState<string>('Transit Custom');
  const [year, setYear] = useState<number>(2023);
  const [vehicleType, setVehicleType] = useState<string>('VAN');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber.trim()) return;
    onAddVehicle({
      registrationNumber: registrationNumber.trim().toUpperCase(),
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      vehicleType
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900 font-['Oswald'] uppercase tracking-wide">Register Fleet Vehicle</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-mono font-bold mb-1">Registration Number (License Plate)</label>
            <input
              required
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g. TX-992-AZ"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-amber-500 text-amber-700 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-mono font-bold mb-1">Make / Brand</label>
              <input
                required
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ford, Mercedes..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-mono font-bold mb-1">Model Name</label>
              <input
                required
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Transit, Sprinter..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-mono font-bold mb-1">Manufacture Year</label>
              <input
                required
                type="number"
                min="1900"
                max="2027"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-mono font-bold mb-1">Vehicle Classification</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              >
                <option value="VAN">VAN</option>
                <option value="TRUCK">TRUCK</option>
                <option value="CAR">CAR</option>
                <option value="SUV">SUV</option>
                <option value="BUS">BUS</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold font-['Oswald'] uppercase tracking-wider transition-colors shadow-xs"
            >
              Register Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
