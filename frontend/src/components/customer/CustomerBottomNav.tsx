import React from 'react';
import { LayoutDashboard, Car, Calendar, MapPin, Award } from 'lucide-react';

interface CustomerBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-vehicles', label: 'Vehicles', icon: Car },
    { id: 'my-bookings', label: 'Bookings', icon: Calendar },
    { id: 'find-service-center', label: 'Garages', icon: MapPin },
    { id: 'rewards', label: 'Rewards', icon: Award }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`bottom-nav-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              isActive ? 'text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-amber-400 text-slate-950' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
