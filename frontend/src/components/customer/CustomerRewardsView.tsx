import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient.ts';
import { Award, Gift, Sparkles, Check, ArrowRight, ShieldCheck, Zap, Ticket } from 'lucide-react';

export const CustomerRewardsView: React.FC = () => {
  const [rewardsData, setRewardsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCustomerRewards();
      setRewardsData(data);
    } catch (err) {
      console.error('Failed to load rewards data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleRedeem = async (code: string) => {
    try {
      setRedeeming(code);
      const res = await apiClient.redeemCustomerCoupon(code);
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        fetchRewards();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Redemption failed' });
    } finally {
      setRedeeming(null);
    }
  };

  if (loading && !rewardsData) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading Fleet Rewards status...
      </div>
    );
  }

  const points = rewardsData?.points || 0;
  const tier = rewardsData?.tier || 'BRONZE';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> FleetOps Elite Membership
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Fleet Loyalty & Rewards Club</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Earn 1 reward point for every dollar spent on certified maintenance, diagnostic scans, and OEM components. Redeem points instantly for service discounts.
            </p>
          </div>

          {/* Balance Widget */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center min-w-[200px]">
            <div className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Active Balance</div>
            <div className="text-3xl sm:text-4xl font-black text-white my-1">{points.toLocaleString()} <span className="text-lg text-amber-400">pts</span></div>
            <div className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
              {tier} VIP
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Current: <strong className="text-white">{tier}</strong></span>
            {rewardsData?.nextTierPointsRemaining > 0 ? (
              <span>{rewardsData.nextTierPointsRemaining} pts to unlock <strong className="text-amber-300">{rewardsData.nextTierName}</strong></span>
            ) : (
              <span className="text-emerald-400 font-semibold">Highest Tier Achieved</span>
            )}
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(15, (points / (points + (rewardsData?.nextTierPointsRemaining || 1))) * 100))}%`
              }}
            />
          </div>
        </div>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="font-bold underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Available Coupons Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-500" /> Available Service Vouchers
            </h2>
            <p className="text-xs text-slate-500">Redeem using your points balance and apply instantly at checkout</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewardsData?.availableCoupons?.map((coupon: any) => {
            const canAfford = points >= coupon.pointsCost;
            return (
              <div
                key={coupon.code}
                id={`coupon-card-${coupon.code}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 uppercase font-mono">
                      CODE: {coupon.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-2">{coupon.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Valid on service orders above ${coupon.minBillAmount}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-emerald-600">${coupon.discountAmount} OFF</div>
                    <div className="text-xs font-bold text-slate-600">{coupon.pointsCost} Points</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Expires: {coupon.expiresAt}</span>
                  <button
                    id={`redeem-btn-${coupon.code}`}
                    onClick={() => handleRedeem(coupon.code)}
                    disabled={!canAfford || redeeming === coupon.code}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      canAfford
                        ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {redeeming === coupon.code ? (
                      <span>Redeeming...</span>
                    ) : canAfford ? (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Redeem Voucher
                      </>
                    ) : (
                      <span>Need {coupon.pointsCost - points} more pts</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Tiers Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Award className="w-4 h-4 text-slate-700" /> Tier Perks & Privileges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 text-sm block mb-1">Silver (750+ pts)</span>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 5% Discount on labor charges</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Free fluid level top-ups</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Standard scheduling queue</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="font-bold text-amber-900 text-sm block mb-1">Gold (1,500+ pts)</span>
            <ul className="space-y-1.5 text-amber-950">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 10% Discount on labor & parts</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Priority technician assignment</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Complimentary car wash with every service</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
            <span className="font-bold text-purple-900 text-sm block mb-1">Platinum (3,000+ pts)</span>
            <ul className="space-y-1.5 text-purple-950">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 15% VIP discount across all services</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Dedicated Master Mechanic</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Free roadside breakdown assistance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
