import React, { useState } from 'react';
import {
  X,
  Camera,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Plus,
  Layers,
  Sparkles
} from 'lucide-react';
import { Booking, RepairImageRecord, RepairImageCategory } from '../../types.ts';

interface RepairImagesModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  images: RepairImageRecord[];
  onUploadImage: (data: {
    bookingId: string;
    vehicleId: string;
    category: RepairImageCategory;
    imageUrl: string;
    caption: string;
    isApprovedForCustomer: boolean;
  }) => Promise<void>;
  onDeleteImage: (id: string) => Promise<void>;
  onToggleApproval: (id: string, isApproved: boolean) => Promise<void>;
}

const SAMPLE_WORKSHOP_PHOTOS = [
  {
    category: 'BEFORE' as RepairImageCategory,
    caption: 'Worn front brake rotor scoring & heavy metal shavings',
    url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=60'
  },
  {
    category: 'AFTER' as RepairImageCategory,
    caption: 'Brand new slotted rotor and ceramic pads installed & torqued',
    url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=60'
  },
  {
    category: 'DIAGNOSTIC' as RepairImageCategory,
    caption: 'ECU pinout probe test on #3 ignition coil signal wire',
    url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=60'
  }
];

export const RepairImagesModal: React.FC<RepairImagesModalProps> = ({
  booking,
  isOpen,
  onClose,
  images,
  onUploadImage,
  onDeleteImage,
  onToggleApproval
}) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [category, setCategory] = useState<RepairImageCategory>('BEFORE');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isApprovedForCustomer, setIsApprovedForCustomer] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (p: typeof SAMPLE_WORKSHOP_PHOTOS[0]) => {
    setCategory(p.category);
    setCaption(p.caption);
    setImageUrl(p.url);
    setShowUploadForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim() || !caption.trim()) return;

    setIsSubmitting(true);
    try {
      await onUploadImage({
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        category,
        imageUrl: imageUrl.trim(),
        caption: caption.trim(),
        isApprovedForCustomer
      });
      setCaption('');
      setImageUrl('');
      setShowUploadForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredImages = images.filter((img) => {
    if (activeFilter === 'ALL') return true;
    return img.category === activeFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Visual Evidence System
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {booking.vehicle?.brand} {booking.vehicle?.model} ({booking.vehicle?.registrationNumber})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Oswald'] uppercase mt-1">
                Before, After & Diagnostic Media
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Presets Banner */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Attach Sample Workshop Photos
              </span>
              <span className="text-[11px] font-mono text-slate-500">Quick upload for simulation</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_WORKSHOP_PHOTOS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-xs font-mono text-slate-200 transition flex items-center gap-2"
                >
                  <span className="font-bold text-cyan-400">[{p.category}]</span>
                  <span className="truncate max-w-[200px] text-slate-300">{p.caption}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Button or Upload Form */}
          {!showUploadForm ? (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              {/* Category Filter Tabs */}
              <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                {['ALL', 'BEFORE', 'AFTER', 'DIAGNOSTIC'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 rounded-lg uppercase transition ${
                      activeFilter === f
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                type="button"
                id="btn-upload-photo-open"
                onClick={() => setShowUploadForm(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase transition flex items-center gap-2 shadow-lg shadow-cyan-950/50"
              >
                <Upload className="w-4 h-4" />
                Upload New Inspection Photo
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Workshop Image
                </h3>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="text-xs text-slate-400 hover:text-white font-mono"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Image Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RepairImageCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="BEFORE">Before Repair (Initial Damage/Wear)</option>
                    <option value="AFTER">After Repair (Fixed / Reassembled)</option>
                    <option value="DIAGNOSTIC">Diagnostic Telemetry / ECU Readout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Customer Visibility
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                      <input
                        type="checkbox"
                        checked={isApprovedForCustomer}
                        onChange={(e) => setIsApprovedForCustomer(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Make Visible to Customer in Portal</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Photo Caption & Inspection Finding <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excessive rotor runout observed, thickness measured at 18.2mm below minimum"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Image URL or Direct Device Upload <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    placeholder="https://images.example.com/repair.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <label className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-mono uppercase font-bold flex items-center justify-center gap-2 cursor-pointer">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    Browse Photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              {imageUrl && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-4">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-24 h-20 object-cover rounded-lg border border-slate-700"
                  />
                  <div className="text-xs font-mono text-slate-400">
                    <div className="font-bold text-white uppercase">{category} Photo Ready</div>
                    <div className="truncate max-w-sm">{caption || 'No caption entered yet'}</div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono uppercase hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !imageUrl.trim()}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono uppercase font-bold shadow-lg shadow-cyan-950/50"
                >
                  {isSubmitting ? 'Uploading...' : 'Save & Publish Photo'}
                </button>
              </div>
            </form>
          )}

          {/* Photos Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
              Uploaded Repair Photos ({filteredImages.length})
            </h3>

            {filteredImages.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
                <ImageIcon className="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-80" />
                <div className="text-sm font-semibold text-slate-200">No Repair Images Attached</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Upload before/after work evidence or diagnostic scope photos to keep customer transparency high.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredImages.map((img) => (
                  <div
                    key={img.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group hover:border-cyan-500/40 transition flex flex-col"
                  >
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      <img
                        src={img.imageUrl}
                        alt={img.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] font-mono font-bold text-cyan-400 uppercase">
                        {img.category}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-200 font-medium line-clamp-2">{img.caption}</p>
                        <span className="text-[10px] font-mono text-slate-500 block mt-1">
                          {new Date(img.createdAt).toLocaleDateString()} by {img.uploadedByName || 'Technician'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => onToggleApproval(img.id, !img.isApprovedForCustomer)}
                          className={`text-[11px] font-mono flex items-center gap-1.5 transition ${
                            img.isApprovedForCustomer
                              ? 'text-emerald-400 hover:text-emerald-300'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {img.isApprovedForCustomer ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Customer Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Internal Only
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteImage(img.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 px-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono uppercase font-bold transition"
          >
            Close Media Bay
          </button>
        </div>
      </div>
    </div>
  );
};
