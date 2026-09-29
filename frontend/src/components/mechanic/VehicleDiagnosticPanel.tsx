import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Zap,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Car,
  Disc,
  Compass,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  ShieldAlert
} from 'lucide-react';
import { OBDDiagnosticRecord, Booking } from '../../types.ts';

interface VehicleDiagnosticPanelProps {
  booking?: Booking | null;
  diagnostics?: OBDDiagnosticRecord[];
  onAddDiagnostic?: (data: {
    bookingId: string;
    faultCode: string;
    problemDescription: string;
    recommendedSolution: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) => Promise<void> | void;
  onResolveDiagnostic?: (id: string) => Promise<void> | void;
}

export const VehicleDiagnosticPanel: React.FC<VehicleDiagnosticPanelProps> = ({
  booking,
  diagnostics = [],
  onAddDiagnostic,
  onResolveDiagnostic
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New DTC Form State
  const [faultCode, setFaultCode] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [recommendedSolution, setRecommendedSolution] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  // Simulated telemetry live state
  const [telemetry, setTelemetry] = useState({
    engineScore: 94,
    rpm: 850,
    engineTemp: '89°C',
    oilPressure: '42 PSI',
    batteryVoltage: 12.6,
    batteryHealth: 98,
    brakeFrontLeftMm: 8.5,
    brakeFrontRightMm: 8.4,
    brakeRearLeftMm: 7.8,
    brakeRearRightMm: 7.9,
    tireFL: 33,
    tireFR: 33,
    tireRL: 32,
    tireRR: 32
  });

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setTelemetry({
        engineScore: Math.floor(88 + Math.random() * 10),
        rpm: Math.floor(800 + Math.random() * 100),
        engineTemp: `${Math.floor(85 + Math.random() * 8)}°C`,
        oilPressure: `${Math.floor(38 + Math.random() * 8)} PSI`,
        batteryVoltage: parseFloat((12.4 + Math.random() * 0.4).toFixed(1)),
        batteryHealth: Math.floor(92 + Math.random() * 7),
        brakeFrontLeftMm: 8.2,
        brakeFrontRightMm: 8.1,
        brakeRearLeftMm: 7.5,
        brakeRearRightMm: 7.6,
        tireFL: 33,
        tireFR: 33,
        tireRL: 32,
        tireRR: 33
      });
      setIsScanning(false);
    }, 1200);
  };

  const handleAddDTC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faultCode.trim() || !problemDescription.trim() || !recommendedSolution.trim()) return;

    if (onAddDiagnostic && booking) {
      await onAddDiagnostic({
        bookingId: booking.id,
        faultCode: faultCode.toUpperCase().trim(),
        problemDescription: problemDescription.trim(),
        recommendedSolution: recommendedSolution.trim(),
        severity
      });
    }

    setFaultCode('');
    setProblemDescription('');
    setRecommendedSolution('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Vehicle Diagnostic Module</h2>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time ECU telemetry, sensor health metrics & OBD-II fault code scanner
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateScan}
            disabled={isScanning}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning ECU...' : 'Scan ECU Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* 4 Telemetry Metric Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Engine Health Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engine Health</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{telemetry.engineScore}%</span>
            <span className="text-xs font-semibold text-emerald-400">Optimal</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Idle RPM:</span>
              <span className="font-mono text-slate-200">{telemetry.rpm} RPM</span>
            </div>
            <div className="flex justify-between">
              <span>Coolant Temp:</span>
              <span className="font-mono text-slate-200">{telemetry.engineTemp}</span>
            </div>
            <div className="flex justify-between">
              <span>Oil Pressure:</span>
              <span className="font-mono text-slate-200">{telemetry.oilPressure}</span>
            </div>
          </div>
        </div>

        {/* 2. Battery Status Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Battery 12V</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{telemetry.batteryVoltage}V</span>
            <span className="text-xs font-semibold text-emerald-400">Healthy</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>State of Health:</span>
              <span className="font-mono text-slate-200">{telemetry.batteryHealth}%</span>
            </div>
            <div className="flex justify-between">
              <span>Alternator Load:</span>
              <span className="font-mono text-slate-200">14.1V Output</span>
            </div>
            <div className="flex justify-between">
              <span>Parasitic Draw:</span>
              <span className="font-mono text-slate-200">0.03A (Normal)</span>
            </div>
          </div>
        </div>

        {/* 3. Brake Condition Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Brake Pads</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Disc className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{telemetry.brakeFrontLeftMm}mm</span>
            <span className="text-xs font-semibold text-emerald-400">Good (75%)</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Front Left / Right:</span>
              <span className="font-mono text-slate-200">{telemetry.brakeFrontLeftMm} / {telemetry.brakeFrontRightMm} mm</span>
            </div>
            <div className="flex justify-between">
              <span>Rear Left / Right:</span>
              <span className="font-mono text-slate-200">{telemetry.brakeRearLeftMm} / {telemetry.brakeRearRightMm} mm</span>
            </div>
            <div className="flex justify-between">
              <span>Rotor Runout:</span>
              <span className="font-mono text-slate-200">&lt; 0.02 mm (Pass)</span>
            </div>
          </div>
        </div>

        {/* 4. Tire Condition Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tire Pressure</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">33 PSI</span>
            <span className="text-xs font-semibold text-emerald-400">Balanced</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>FL: <span className="font-mono text-slate-200">{telemetry.tireFL} PSI</span></span>
              <span>FR: <span className="font-mono text-slate-200">{telemetry.tireFR} PSI</span></span>
            </div>
            <div className="flex justify-between">
              <span>RL: <span className="font-mono text-slate-200">{telemetry.tireRL} PSI</span></span>
              <span>RR: <span className="font-mono text-slate-200">{telemetry.tireRR} PSI</span></span>
            </div>
            <div className="flex justify-between">
              <span>Tread Depth:</span>
              <span className="font-mono text-slate-200">6.2 mm (Good)</span>
            </div>
          </div>
        </div>
      </div>

      {/* OBD-II Fault Codes Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              OBD-II Diagnostic Trouble Codes (DTC)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live ECU scanned error codes, freeze-frame data and technician resolution checklists
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel' : 'Log Fault Code'}</span>
          </button>
        </div>

        {/* Add DTC Form Modal/Inline */}
        {showAddForm && (
          <form onSubmit={handleAddDTC} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">DTC Fault Code</label>
                <input
                  type="text"
                  placeholder="e.g. P0300, P0171, C0035"
                  value={faultCode}
                  onChange={(e) => setFaultCode(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  aria-label="Severity Level"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="LOW">Low (Informational alert)</option>
                  <option value="MEDIUM">Medium (Service required soon)</option>
                  <option value="HIGH">High (Immediate inspection)</option>
                  <option value="CRITICAL">Critical (Engine protection shutdown)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Problem Description</label>
              <input
                type="text"
                placeholder="e.g. Random/Multiple Cylinder Misfire Detected in Bank 1"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Recommended Solution / Repair Path</label>
              <textarea
                rows={2}
                placeholder="e.g. Inspect spark plug gap and test ignition coil primary circuit."
                value={recommendedSolution}
                onChange={(e) => setRecommendedSolution(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 bg-slate-900 text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-md"
              >
                Save Fault Code
              </button>
            </div>
          </form>
        )}

        {/* DTC Codes List */}
        {diagnostics.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-semibold text-slate-200">No active OBD-II DTC fault codes</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              ECU diagnostic scan reports zero active fault triggers for this vehicle.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {diagnostics.map((dtc) => (
              <div
                key={dtc.id}
                className={`p-4 rounded-xl border transition-all ${
                  dtc.isResolved
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : dtc.severity === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-base font-extrabold px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-400">
                      {dtc.faultCode}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{dtc.problemDescription}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          dtc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                          dtc.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {dtc.severity || 'MEDIUM'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        <span className="text-slate-500 font-semibold">Solution:</span> {dtc.recommendedSolution}
                      </div>
                    </div>
                  </div>

                  {!dtc.isResolved && onResolveDiagnostic && (
                    <button
                      onClick={() => onResolveDiagnostic(dtc.id)}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-end sm:self-auto shrink-0 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleDiagnosticPanel;
