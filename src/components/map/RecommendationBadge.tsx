import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Star, Info, Award } from 'lucide-react';

interface RecommendationBadgeProps {
  score?: number;
  isBestChoice?: boolean;
  isVerified?: boolean;
  scoreBreakdown?: {
    ratingScore: number;
    distanceScore: number;
    completedServicesScore: number;
    experienceScore: number;
    total: number;
  };
  compact?: boolean;
}

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  score = 0,
  isBestChoice = false,
  isVerified = false,
  scoreBreakdown,
  compact = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Score color tiers
  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40';
    if (val >= 70) return 'text-amber-400 bg-amber-950/70 border-amber-500/40';
    return 'text-zinc-400 bg-zinc-900 border-zinc-700';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {isBestChoice && (
          <span
            id="badge-best-choice-compact"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
            Top Recommendation
          </span>
        )}
        {isVerified && (
          <span
            id="badge-verified-compact"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-950/60 border border-blue-500/40 text-blue-300"
          >
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            Verified
          </span>
        )}
        {score > 0 && (
          <span
            id="badge-score-compact"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(score)}`}
          >
            <Award className="w-3 h-3" />
            {score}% Match
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      {isBestChoice && (
        <span
          id="badge-best-choice-full"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-500/10 border border-amber-400/60 text-amber-200 shadow-md shadow-amber-950/50 tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
          ⭐ #1 SMART CHOICE
        </span>
      )}

      {isVerified && (
        <span
          id="badge-verified-full"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-950/70 border border-blue-500/40 text-blue-200"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          FleetOps Verified
        </span>
      )}

      {score > 0 && (
        <div className="relative">
          <button
            type="button"
            id="badge-score-breakdown-trigger"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${getScoreColor(
              score
            )} hover:brightness-110`}
          >
            <span className="font-mono">{score}</span>
            <span className="text-[10px] opacity-75">/ 100</span>
            <Info className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* Breakdown Tooltip */}
          {showTooltip && scoreBreakdown && (
            <div
              id="badge-score-popover"
              className="absolute z-50 left-0 bottom-full mb-2 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl text-left pointer-events-none"
            >
              <div className="text-xs font-bold text-zinc-100 mb-2 flex items-center justify-between border-b border-zinc-800 pb-1.5">
                <span>Recommendation Score</span>
                <span className="text-amber-400 font-mono font-extrabold">{score}%</span>
              </div>
              <div className="space-y-1.5 text-xs text-zinc-300">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Rating Weight (40%):</span>
                  <span className="font-mono font-medium text-emerald-400">{scoreBreakdown.ratingScore} / 40</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Distance Weight (30%):</span>
                  <span className="font-mono font-medium text-blue-400">{scoreBreakdown.distanceScore} / 30</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Repairs Done (20%):</span>
                  <span className="font-mono font-medium text-purple-400">{scoreBreakdown.completedServicesScore} / 20</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Experience (10%):</span>
                  <span className="font-mono font-medium text-amber-400">{scoreBreakdown.experienceScore} / 10</span>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-zinc-800 text-[10px] text-zinc-400 italic">
                Calculated dynamically via Haversine proximity & quality metrics.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
