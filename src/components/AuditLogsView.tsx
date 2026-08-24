import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Layers,
  Car,
  FileText,
  DollarSign,
  Tag
} from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import { AuditLog } from '../types.ts';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAdminAuditLogs();
      setLogs(res.auditLogs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.performedByName && log.performedByName.toLowerCase().includes(search.toLowerCase())) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    if (filterType === 'ALL') return matchesSearch;
    return matchesSearch && log.targetType === filterType;
  });

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'USER':
        return <User className="w-4 h-4 text-rose-400" />;
      case 'VEHICLE':
        return <Car className="w-4 h-4 text-blue-400" />;
      case 'BOOKING':
        return <Activity className="w-4 h-4 text-amber-400" />;
      case 'INVOICE':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'FEEDBACK':
        return <FileText className="w-4 h-4 text-purple-400" />;
      case 'MARKETPLACE':
        return <Tag className="w-4 h-4 text-cyan-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-rose-500/40 bg-rose-500/10 text-rose-400">
              👑 ADMIN RESTRICTED
            </span>
            <span className="text-xs text-slate-400 font-mono">Realtime Security Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Oswald'] uppercase tracking-tight mt-1">
            System Audit Logs
          </h1>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-2 font-mono self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit actions, users, descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'USER', 'BOOKING', 'VEHICLE', 'INVOICE', 'MARKETPLACE'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === type
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
            <p className="text-xs font-mono text-slate-400">Loading audit trail records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white font-['Oswald'] uppercase tracking-wider">
              No Audit Logs Found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              No actions match your current search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                    {getTargetIcon(log.targetType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {log.targetType}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {log.performedByName || 'System'} ({log.performedByRole || 'SYSTEM'})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
