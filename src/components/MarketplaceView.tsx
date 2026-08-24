import React, { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  Plus,
  BadgeCheck,
  Calendar,
  Gauge,
  DollarSign,
  MessageSquare,
  Sparkles,
  RefreshCw,
  X,
  Send,
  User,
  Car
} from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import { MarketplaceListing, User as UserType } from '../types.ts';
import { useAuth } from '../auth/AuthContext.tsx';

export const MarketplaceView: React.FC = () => {
  const { user, role } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Create Listing Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: '',
    condition: 'VERY_GOOD',
    vehicleType: 'CAR',
    description: ''
  });
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  // Inquiry Modal State
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    message: '',
    phone: user?.phone || '',
    offerPrice: ''
  });
  const [submittingInquiry, setSubmittingInquiry] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getMarketplaceListings();
      setListings(res.listings || []);
    } catch (err) {
      console.error('Failed to fetch marketplace listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.brand || !createForm.model || !createForm.price) return;

    try {
      setSubmittingCreate(true);
      await apiClient.createMarketplaceListing({
        title: createForm.title,
        brand: createForm.brand,
        model: createForm.model,
        year: Number(createForm.year),
        price: Number(createForm.price),
        mileage: Number(createForm.mileage || 0),
        condition: createForm.condition,
        vehicleType: createForm.vehicleType,
        description: createForm.description
      });
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        price: '',
        mileage: '',
        condition: 'VERY_GOOD',
        vehicleType: 'CAR',
        description: ''
      });
      fetchListings();
    } catch (err: any) {
      alert(err.message || 'Failed to create listing');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing || !inquiryForm.message) return;

    try {
      setSubmittingInquiry(true);
      await apiClient.submitMarketplaceInquiry(selectedListing.id, {
        message: inquiryForm.message,
        phone: inquiryForm.phone,
        offerPrice: inquiryForm.offerPrice ? Number(inquiryForm.offerPrice) : undefined
      });
      setInquirySuccess('Your purchase inquiry and offer have been sent to the seller!');
      setTimeout(() => {
        setInquirySuccess(null);
        setSelectedListing(null);
        setInquiryForm({ message: '', phone: user?.phone || '', offerPrice: '' });
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit inquiry');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.model.toLowerCase().includes(search.toLowerCase());

    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'VERIFIED') return matchesSearch && item.verifiedByMechanic;
    return matchesSearch && item.vehicleType === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
              🏷️ FLEET MARKETPLACE
            </span>
            <span className="text-xs text-slate-400 font-mono">Verified Vehicle Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Oswald'] uppercase tracking-tight mt-1">
            Certified Pre-Owned & Fleet Marketplace
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchListings}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 font-['Oswald'] uppercase tracking-wider cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>List Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search make, model, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'VERIFIED', 'CAR', 'TRUCK', 'VAN'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === type
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {type === 'VERIFIED' ? '🛡️ Mechanic Verified' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading marketplace vehicles...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-wider">
            No Listings Found
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Be the first to list a verified fleet vehicle or adjust your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all group"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.vehicleType}
                  </span>
                  {item.verifiedByMechanic && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Mechanic Inspected
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans line-clamp-2">
                  {item.description}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{item.year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Gauge className="w-3.5 h-3.5 text-blue-400" />
                    <span>{item.mileage.toLocaleString()} mi</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-500">Condition:</span>
                    <span className="text-amber-300 font-bold">{item.condition}</span>
                  </div>
                </div>
              </div>

              {/* Price & Seller Action */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Listed Price</span>
                  <span className="text-lg font-bold text-emerald-400 font-['Oswald']">
                    ${item.price.toLocaleString()}
                  </span>
                </div>

                {role === 'CUSTOMER' ? (
                  <button
                    onClick={() => setSelectedListing(item)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 font-['Oswald'] uppercase tracking-wider cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Inquire</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {item.sellerName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h2 className="text-lg font-bold text-white font-['Oswald'] uppercase tracking-tight flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                List Vehicle on Marketplace
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Listing Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2021 Ford Transit Cargo Van"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Make / Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ford, Toyota, etc."
                    value={createForm.brand}
                    onChange={(e) => setCreateForm({ ...createForm, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="Transit 250, Camry, etc."
                    value={createForm.model}
                    onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={createForm.year}
                    onChange={(e) => setCreateForm({ ...createForm, year: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={createForm.price}
                    onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Mileage</label>
                  <input
                    type="number"
                    placeholder="45000"
                    value={createForm.mileage}
                    onChange={(e) => setCreateForm({ ...createForm, mileage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe maintenance history, features, and condition..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {role === 'MECHANIC' || role === 'ADMIN' ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Your staff account automatically grants "Mechanic Inspected" verification!</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submittingCreate}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 rounded-xl font-['Oswald'] uppercase tracking-wider cursor-pointer active:scale-98 disabled:opacity-50 mt-2"
              >
                {submittingCreate ? 'Publishing...' : 'Publish Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer Inquiry Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-['Oswald'] uppercase tracking-tight">
                  Purchase Inquiry
                </h2>
                <p className="text-xs text-amber-400 font-mono">{selectedListing.title}</p>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inquirySuccess ? (
              <div className="py-8 text-center space-y-2">
                <BadgeCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-white">{inquirySuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Your Message *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Hi, I am interested in viewing this vehicle..."
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Your Phone</label>
                    <input
                      type="text"
                      placeholder="555-0199"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Offer Price ($)</label>
                    <input
                      type="number"
                      placeholder={`e.g. ${selectedListing.price}`}
                      value={inquiryForm.offerPrice}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, offerPrice: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 rounded-xl font-['Oswald'] uppercase tracking-wider cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingInquiry ? 'Sending...' : 'Send Inquiry to Seller'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
