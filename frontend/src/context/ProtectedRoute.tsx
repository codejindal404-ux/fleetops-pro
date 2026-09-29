import React, { ReactNode } from 'react';
import { ShieldAlert, Lock, ArrowRight, Home } from 'lucide-react';
import { useAuth } from './AuthContext.tsx';
import { Role } from '../types.ts';
import { ROLE_INFO } from '../permissions/rolePermissions.ts';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallbackToHome?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  fallbackToHome
}) => {
  const { user, role, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !role) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase tracking-tight">
            Authentication Required
          </h2>
          <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
            You must be signed in with valid role credentials to view this area.
          </p>
        </div>
      </div>
    );
  }

  const isAllowed = allowedRoles.includes(role);

  if (!isAllowed) {
    const currentRoleMeta = ROLE_INFO[role];
    const allowedMeta = allowedRoles.map((r) => ROLE_INFO[r]);

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-rose-900/40 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top glowing security bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase tracking-wider">
                  HTTP 403 Forbidden
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  RBAC Policy Violation
                </span>
              </div>
              <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase tracking-tight mt-1">
                Access Restricted
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            Your current authenticated profile does not possess authorization for this route or action.
          </p>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3 mb-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Current User:</span>
              <span className="text-white font-sans font-medium">{user.name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Current Role:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${currentRoleMeta?.color || ''}`}>
                {currentRoleMeta?.badge || role}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Required Roles:</span>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {allowedMeta.map((meta, idx) => (
                  <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.color}`}>
                    {meta.badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {fallbackToHome && (
            <button
              onClick={fallbackToHome}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 font-['Oswald'] uppercase tracking-wider cursor-pointer active:scale-98"
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>Return to Authorized Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
