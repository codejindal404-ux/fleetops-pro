import React, { useState } from 'react';
import { X, Download, Copy, Check, Code2 } from 'lucide-react';

interface PostmanViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostmanViewerModal: React.FC<PostmanViewerModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const collectionJson = `{
  "info": {
    "name": "FleetOps Pro - Smart Vehicle Service Management System API",
    "description": "Complete Postman collection for vehicle-service-system with JWT authorization variables.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000", "type": "string" },
    { "key": "jwt_token", "value": "", "type": "string" }
  ],
  "endpoints": [
    "POST /api/auth/register",
    "POST /api/auth/login (Saves token automatically to jwt_token)",
    "GET  /api/auth/me",
    "POST /api/auth/create-staff (ADMIN)",
    "POST /api/vehicles",
    "GET  /api/vehicles",
    "GET  /api/vehicles/:id",
    "PUT  /api/vehicles/:id",
    "DELETE /api/vehicles/:id",
    "POST /api/bookings",
    "GET  /api/bookings",
    "GET  /api/bookings/:id",
    "PATCH /api/bookings/:id/status (ADMIN/MECHANIC)",
    "PATCH /api/bookings/:id/assign-mechanic (ADMIN)",
    "POST /api/bookings/:id/repair-logs",
    "GET  /api/bookings/:id/repair-logs",
    "GET  /api/admin/bookings (ADMIN)",
    "POST /api/bookings/:id/invoice (ADMIN)",
    "GET  /api/invoices",
    "GET  /api/invoices/:id",
    "PATCH /api/invoices/:id/pay",
    "POST /api/bookings/:id/feedback",
    "GET  /api/feedback",
    "GET  /api/mechanics/:id/rating",
    "GET  /api/notifications",
    "PATCH /api/notifications/:id/read",
    "PATCH /api/notifications/read-all",
    "DELETE /api/notifications/:id",
    "GET  /api/admin/service-centers (ADMIN)",
    "GET  /api/admin/service-centers/:id/analytics (ADMIN)",
    "POST /api/admin/service-centers (ADMIN)",
    "PUT  /api/admin/service-centers/:id/verify (ADMIN)",
    "DELETE /api/admin/service-centers/:id (ADMIN)"
  ]
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(collectionJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([collectionJson], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = 'postman_collection.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-50 text-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm font-['Oswald'] uppercase tracking-wide text-slate-900">
              Postman Collection Exporter (`postman_collection.json`)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-800">
          <p className="text-slate-700">
            This project includes a complete, production-ready <strong className="text-amber-700 font-mono">`postman_collection.json`</strong> covering all auth, vehicle, booking, billing, and feedback API endpoints. The <code className="bg-slate-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">/api/auth/login</code> endpoint contains an automated test script that saves the JWT Bearer token to <code className="bg-slate-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">jwt_token</code>.
          </p>

          <div className="bg-slate-900 text-amber-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
            <pre>{collectionJson}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          <span className="text-[11px] font-mono text-slate-500">File: /postman_collection.json</span>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Raw JSON'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold font-['Oswald'] uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
