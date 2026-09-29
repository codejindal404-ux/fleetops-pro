import React, { useState, useCallback, useRef } from 'react';
import {
  Search, User, Car, Calendar, Building2,
  X, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, Clock, DollarSign, Phone, Mail
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.ts';

type SearchCategory = 'ALL' | 'USERS' | 'VEHICLES' | 'BOOKINGS' | 'SERVICE_CENTERS';

interface SearchResult {
  id: string;
  type: 'USER' | 'VEHICLE' | 'BOOKING' | 'SERVICE_CENTER';
  title: string;
  subtitle: string;
  meta?: string;
  badge?: string;
  badgeColor?: string;
}

function formatSearchResults(data: any): SearchResult[] {
  const results: SearchResult[] = [];

  (data?.users || []).forEach((u: any) => {
    results.push({
      id: u.id,
      type: 'USER',
      title: u.name,
      subtitle: u.email,
      meta: u.phone || '',
      badge: u.role,
      badgeColor: u.role === 'ADMIN' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
        : u.role === 'MECHANIC' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    });
  });

  (data?.vehicles || []).forEach((v: any) => {
    results.push({
      id: v.id,
      type: 'VEHICLE',
      title: `${v.brand} ${v.model} (${v.year})`,
      subtitle: `Plate: ${v.registrationNumber}`,
      meta: v.vehicleType || v.type || 'Car',
      badge: v.status || 'ACTIVE',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    });
  });

  (data?.bookings || []).forEach((b: any) => {
    results.push({
      id: b.id,
      type: 'BOOKING',
      title: b.serviceType,
      subtitle: `${b.vehicle?.brand || ''} ${b.vehicle?.model || ''} • ${b.preferredDate || ''}`,
      meta: `$${b.estimatedCost || 0}`,
      badge: b.status,
      badgeColor: b.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        : b.status === 'CANCELLED' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
        : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    });
  });

  (data?.serviceCenters || []).forEach((sc: any) => {
    results.push({
      id: sc.id,
      type: 'SERVICE_CENTER',
      title: sc.name,
      subtitle: sc.address || '',
      meta: `★ ${(sc.averageRating || 0).toFixed(1)}`,
      badge: sc.isVerified ? 'VERIFIED' : 'UNVERIFIED',
      badgeColor: sc.isVerified ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-slate-400 bg-slate-500/10 border-slate-500/30'
    });
  });

  return results;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  USER:           <User className="w-4 h-4 text-purple-400" />,
  VEHICLE:        <Car className="w-4 h-4 text-amber-400" />,
  BOOKING:        <Calendar className="w-4 h-4 text-cyan-400" />,
  SERVICE_CENTER: <Building2 className="w-4 h-4 text-emerald-400" />
};

const TYPE_BG: Record<string, string> = {
  USER:           'bg-purple-500/10 border-purple-500/20',
  VEHICLE:        'bg-amber-500/10 border-amber-500/20',
  BOOKING:        'bg-cyan-500/10 border-cyan-500/20',
  SERVICE_CENTER: 'bg-emerald-500/10 border-emerald-500/20'
};

interface GlobalSearchViewProps {
  searchTerm?: string;
  onNavigate?: (tab: string) => void;
}

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({ searchTerm = '', onNavigate }) => {
  const [query, setQuery] = useState(searchTerm);
  const [category, setCategory] = useState<SearchCategory>('ALL');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<any>(null);

  const doSearch = useCallback(async (q: string, cat: SearchCategory) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.adminGlobalSearch(q.trim(), cat === 'ALL' ? undefined : cat);
      setResults(formatSearchResults(data));
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val, category), 400);
  };

  const handleCategoryChange = (cat: SearchCategory) => {
    setCategory(cat);
    doSearch(query, cat);
  };

  const filteredResults = category === 'ALL'
    ? results
    : results.filter(r => r.type === category.slice(0, -1) as any);

  const categories: { id: SearchCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL',             label: 'All',             icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'USERS',           label: 'Users',           icon: <User className="w-3.5 h-3.5" /> },
    { id: 'VEHICLES',        label: 'Vehicles',        icon: <Car className="w-3.5 h-3.5" /> },
    { id: 'BOOKINGS',        label: 'Bookings',        icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'SERVICE_CENTERS', label: 'Service Centers', icon: <Building2 className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white uppercase font-['Oswald'] tracking-wide flex items-center gap-3">
          <Search className="w-7 h-7 text-amber-400" /> Global Search
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Search across users, vehicles, bookings, and service centers in one place
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          id="global-search-input"
          type="text"
          placeholder="Search anything — name, plate number, booking ID, email..."
          value={query}
          onChange={e => handleInput(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-12 py-4 bg-slate-900 border border-slate-700 focus:border-amber-500/60 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none transition-colors shadow-xl font-mono"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setHasSearched(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => handleCategoryChange(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              category === cat.id
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}>
            {cat.icon} {cat.label}
            {cat.id !== 'ALL' && hasSearched && (
              <span className="ml-1 text-[10px] text-slate-500">
                ({results.filter(r => {
                  const map: Record<string, string> = { USERS: 'USER', VEHICLES: 'VEHICLE', BOOKINGS: 'BOOKING', SERVICE_CENTERS: 'SERVICE_CENTER' };
                  return r.type === map[cat.id];
                }).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Placeholder */}
      {!hasSearched && !loading && !error && (
        <div className="py-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-400">Start typing to search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Type at least 2 characters to search across the entire FleetOps Pro database
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['Oil Change', 'Toyota', 'MH04AB1234', 'admin@', 'Brake'].map(hint => (
              <button key={hint} onClick={() => handleInput(hint)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs hover:border-amber-500/40 hover:text-amber-400 transition-all">
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && filteredResults.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400">No results found for <strong className="text-white">"{query}"</strong></p>
        </div>
      )}

      {filteredResults.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-slate-400 font-mono">
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for <strong className="text-white">"{query}"</strong>
          </div>
          <div className="space-y-2">
            {filteredResults.map(result => (
              <div key={`${result.type}-${result.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all group cursor-pointer">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${TYPE_BG[result.type]}`}>
                    {TYPE_ICON[result.type]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{result.title}</span>
                      {result.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${result.badgeColor}`}>
                          {result.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">{result.subtitle}</p>
                    {result.meta && <p className="text-[11px] text-slate-500">{result.meta}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{result.type.replace('_', ' ')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchView;
