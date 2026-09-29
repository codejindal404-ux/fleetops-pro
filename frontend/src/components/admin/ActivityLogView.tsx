import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, User, Car, Calendar, CreditCard, Building2,
  LogIn, Settings, AlertCircle, CheckCircle2, Clock,
  Search, Filter, ChevronDown, RefreshCw, Download,
  Tag, Trash2, Edit, Key
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.ts';
import { AuditLog } from '../../types.ts';

type LogCategory = 'ALL' | 'AUTH' | 'USER' | 'BOOKING' | 'PAYMENT' | 'SERVICE_CENTER' | 'SYSTEM';

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  AUTH:           { icon: <LogIn className="w-3.5 h-3.5" />,    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',   label: 'Authentication' },
  USER:           { icon: <User className="w-3.5 h-3.5" />,     color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', label: 'User Management' },
  BOOKING:        { icon: <Calendar className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'Bookings' },
  PAYMENT:        { icon: <CreditCard className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Payments' },
  SERVICE_CENTER: { icon: <Building2 className="w-3.5 h-3.5" />, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',  label: 'Service Centers' },
  SYSTEM:         { icon: <Settings className="w-3.5 h-3.5" />, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', label: 'System' },
  VEHICLE:        { icon: <Car className="w-3.5 h-3.5" />,      color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', label: 'Vehicles' }
};

const ACTION_CATEGORY: Record<string, string> = {
  LOGIN: 'AUTH', LOGOUT: 'AUTH', LOGIN_FAILED: 'AUTH',
  CREATE_USER: 'USER', DELETE_USER: 'USER', SUSPEND_USER: 'USER', ACTIVATE_USER: 'USER',
  CREATE_MECHANIC: 'USER', ADMIN_RESET_PASSWORD: 'USER', ROLE_CHANGE: 'USER',
  BOOKING_CREATED: 'BOOKING', BOOKING_CANCELLED: 'BOOKING', BOOKING_STATUS_UPDATED: 'BOOKING',
  STATUS_UPDATED: 'BOOKING', ASSIGN_MECHANIC: 'BOOKING',
  PAYMENT_PROCESSED: 'PAYMENT', INVOICE_CREATED: 'PAYMENT', INVOICE_PAID: 'PAYMENT',
  SERVICE_CENTER_CREATED: 'SERVICE_CENTER', SERVICE_CENTER_VERIFIED: 'SERVICE_CENTER',
  SERVICE_CENTER_DELETED: 'SERVICE_CENTER', UPDATE_SERVICE_CENTER: 'SERVICE_CENTER'
};

function getCategory(action: string): string {
  return ACTION_CATEGORY[action] || 'SYSTEM';
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return dateStr; }
}

interface ActivityLogViewProps {
  searchTerm?: string;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ searchTerm = '' }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [categoryFilter, setCategoryFilter] = useState<LogCategory>('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAdminAuditLogs();
      setLogs((data.auditLogs || []).reverse());
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setLocalSearch(searchTerm); }, [searchTerm]);

  const filtered = logs.filter(log => {
    const cat = getCategory(log.action);
    const matchCat = categoryFilter === 'ALL' || cat === categoryFilter;
    const q = localSearch.toLowerCase().trim();
    const matchQ = !q || [log.action, log.performedByName, log.details, log.targetType, log.targetId]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const categoryCounts = (['AUTH','USER','BOOKING','PAYMENT','SERVICE_CENTER','SYSTEM'] as LogCategory[]).map(cat => ({
    id: cat,
    count: logs.filter(l => getCategory(l.action) === cat).length
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Compliance · RBAC Audit</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase font-['Oswald'] tracking-wide">Activity Audit Log</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Full chronological trail — {logs.length} events recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => { setCategoryFilter('ALL'); setPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${categoryFilter === 'ALL' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}
        >
          All ({logs.length})
        </button>
        {categoryCounts.map(({ id, count }) => {
          const cfg = CATEGORY_CONFIG[id] || CATEGORY_CONFIG.SYSTEM;
          const isActive = categoryFilter === id;
          return (
            <button key={id} onClick={() => { setCategoryFilter(id as LogCategory); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${isActive ? `${cfg.color} border-current` : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}
            >
              {cfg.icon} {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input type="text" placeholder="Search by action, user, target, details..."
          value={localSearch} onChange={e => { setLocalSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors font-mono" />
      </div>

      {/* Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-mono">Loading audit trail...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Shield className="w-10 h-10 text-slate-700 mx-auto" />
            <h4 className="text-sm font-bold text-slate-400">No matching audit events</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Performed By</th>
                  <th className="px-4 py-3 text-left">Target</th>
                  <th className="px-4 py-3 text-left">Details</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginated.map(log => {
                  const cat = getCategory(log.action);
                  const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.SYSTEM;
                  const isSuccess = log.status === 'SUCCESS' || !log.status;
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {formatTime((log as any).createdAt || log.timestamp || '')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-white font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 w-fit ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-200 font-semibold">{log.performedByName || 'System'}</div>
                        <div className="text-slate-500 text-[10px] font-mono">{log.performedByRole}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {log.targetType && <span className="text-slate-300">{log.targetType}</span>}
                        {log.targetId && <div className="text-slate-600 text-[10px]">#{log.targetId.slice(-8)}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-[280px]">
                        <p className="line-clamp-2 text-[11px]">{log.details}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSuccess ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                          {log.status || 'SUCCESS'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} events</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 disabled:opacity-40 hover:bg-slate-700 transition-colors">← Prev</button>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 disabled:opacity-40 hover:bg-slate-700 transition-colors">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogView;
