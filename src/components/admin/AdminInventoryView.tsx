import React, { useState, useEffect, useMemo } from 'react';
import {
  PackageCheck,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  DollarSign,
  Layers,
  Clock,
  ArrowUpDown,
  RefreshCw,
  TrendingUp,
  Tag,
  Wrench
} from 'lucide-react';
import { ServiceInventoryRecord } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';

interface AdminInventoryViewProps {
  searchTerm?: string;
}

export const AdminInventoryView: React.FC<AdminInventoryViewProps> = ({ searchTerm: externalSearch }) => {
  const [items, setItems] = useState<ServiceInventoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ServiceInventoryRecord | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'GENERAL' as any,
    code: '',
    price: 1500,
    costPrice: 800,
    stockQuantity: 50,
    reorderLevel: 10,
    estimatedDurationMins: 45,
    description: ''
  });

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.getServicesInventory();
      if (res && res.items) {
        setItems(res.items);
      }
    } catch (err) {
      console.warn('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'GENERAL',
      code: `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
      price: 1800,
      costPrice: 900,
      stockQuantity: 40,
      reorderLevel: 10,
      estimatedDurationMins: 45,
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ServiceInventoryRecord) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      code: item.code,
      price: item.price,
      costPrice: item.costPrice,
      stockQuantity: item.stockQuantity,
      reorderLevel: item.reorderLevel,
      estimatedDurationMins: item.estimatedDurationMins,
      description: item.description
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;

    try {
      setIsSaving(true);
      if (editingItem) {
        await apiClient.updateInventoryItem(editingItem.id, formData);
      } else {
        await apiClient.createInventoryItem(formData);
      }
      setIsModalOpen(false);
      await fetchInventory();
    } catch (err) {
      console.error('Failed to save inventory item:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the inventory catalog?`)) return;
    try {
      await apiClient.deleteInventoryItem(id);
      await fetchInventory();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Inventory KPI statistics
  const kpis = useMemo(() => {
    const totalItems = items.length;
    const lowStockCount = items.filter((i) => i.status === 'LOW_STOCK' || i.stockQuantity <= i.reorderLevel).length;
    const outOfStockCount = items.filter((i) => i.status === 'OUT_OF_STOCK' || i.stockQuantity === 0).length;
    const totalRetailValue = items.reduce((acc, i) => acc + i.price * i.stockQuantity, 0);
    const totalCostValue = items.reduce((acc, i) => acc + i.costPrice * i.stockQuantity, 0);
    const avgMargin = totalRetailValue > 0 ? Math.round(((totalRetailValue - totalCostValue) / totalRetailValue) * 100) : 45;

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalRetailValue,
      avgMargin
    };
  }, [items]);

  const categories = ['ALL', 'BRAKES', 'ENGINE', 'TIRES', 'FLUIDS', 'ELECTRICAL', 'SUSPENSION', 'INSPECTION', 'GENERAL'];

  // Filtered list
  const filteredItems = useMemo(() => {
    const effectiveSearch = externalSearch || searchTerm;
    return items.filter((item) => {
      const matchSearch =
        !effectiveSearch ||
        item.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(effectiveSearch.toLowerCase());

      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'LOW_STOCK' && (item.status === 'LOW_STOCK' || item.stockQuantity <= item.reorderLevel)) ||
        (selectedStatus === 'OUT_OF_STOCK' && (item.status === 'OUT_OF_STOCK' || item.stockQuantity === 0)) ||
        (selectedStatus === 'IN_STOCK' && item.status === 'IN_STOCK' && item.stockQuantity > item.reorderLevel);

      return matchSearch && matchCat && matchStatus;
    });
  }, [items, searchTerm, selectedCategory, selectedStatus]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Fleet Operations Logistics
            </span>
          </div>
          <h1 className="text-2xl font-black text-white font-['Oswald'] uppercase tracking-tight flex items-center gap-2.5">
            <PackageCheck className="w-6 h-6 text-amber-400" />
            Services & Spare Parts Catalog
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage standard repair packages, component costs, stock thresholds, and operational duration for automotive service bays.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInventory}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs font-['Oswald'] uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add Service / Part</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Catalog Items</span>
          <div className="text-xl font-black text-white font-mono">{kpis.totalItems}</div>
          <span className="text-[10px] text-slate-500">Active services & parts</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Low Stock Warning</span>
          <div className="text-xl font-black text-amber-400 font-mono">{kpis.lowStockCount}</div>
          <span className="text-[10px] text-amber-400/80">At or below reorder level</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Out of Stock</span>
          <div className="text-xl font-black text-rose-400 font-mono">{kpis.outOfStockCount}</div>
          <span className="text-[10px] text-rose-400/80">Immediate procurement needed</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Inventory Valuation</span>
          <div className="text-xl font-black text-emerald-400 font-mono">₹{(kpis.totalRetailValue / 1000).toFixed(1)}k</div>
          <span className="text-[10px] text-emerald-400/80">Total retail asset value</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Gross Margin</span>
          <div className="text-xl font-black text-indigo-400 font-mono">{kpis.avgMargin}%</div>
          <span className="text-[10px] text-indigo-400/80">Avg markup over cost</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search parts, services, item codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Status: All</option>
            <option value="IN_STOCK">Status: In Stock</option>
            <option value="LOW_STOCK">Status: Low Stock Alert</option>
            <option value="OUT_OF_STOCK">Status: Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Item Code & Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Retail Price</th>
                <th className="py-3.5 px-4">Cost Price</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Est. Bay Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    No services or parts match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.stockQuantity <= item.reorderLevel && item.stockQuantity > 0;
                  const isOut = item.stockQuantity === 0;
                  const marginPct = item.price > 0 ? Math.round(((item.price - item.costPrice) / item.price) * 100) : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-850/60 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-amber-500" />
                          {item.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Code: <span className="text-slate-400">{item.code}</span> • {item.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-emerald-400">₹{item.price.toLocaleString()}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-400">₹{item.costPrice.toLocaleString()}</div>
                        <div className="text-[9px] font-mono text-indigo-400">+{marginPct}% margin</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-200'}`}>
                            {item.stockQuantity} units
                          </span>
                          {isLow && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              REORDER
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">Min: {item.reorderLevel} units</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {item.estimatedDurationMins}m
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isOut
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Item"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            title="Delete Item"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
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

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase font-['Oswald']">
                {editingItem ? 'Edit Service / Inventory Item' : 'Add New Service / Inventory Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Item / Service Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Synthetic Engine Oil 5W-30"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">SKU / Item Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="SRV-4091"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.filter((c) => c !== 'ALL').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Estimated Bay Duration (mins)</label>
                  <input
                    type="number"
                    min="5"
                    value={formData.estimatedDurationMins}
                    onChange={(e) => setFormData({ ...formData, estimatedDurationMins: parseInt(e.target.value) || 30 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Retail Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Cost Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Reorder Level Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 5 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Service package specifications or component details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-['Oswald'] uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
