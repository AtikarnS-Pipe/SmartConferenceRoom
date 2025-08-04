import React from 'react';
import { Users, UserCheck, Shield, Activity, TrendingUp, Clock } from 'lucide-react';

function HousekeeperStats({ housekeeperCount, adminCount, filteredMembers, darkMode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Main Housekeeper Card - Prominent Display */}
      <div className={`md:col-span-1 relative overflow-hidden rounded-2xl py-6 px-7 shadow-lg border-2 ${
        darkMode 
          ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 border-blue-700' 
          : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 border-blue-300'
      }`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Housekeeper</p>
              <p className="text-white text-4xl font-bold mt-1">{housekeeperCount}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          
          
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      </div>
      <div className={`md:col-span-1 relative overflow-hidden rounded-2xl py-6 px-7 shadow-lg border-2 ${
        darkMode 
            ? 'bg-gradient-to-br from-rose-900 via-amber-800 to-yellow-900 border-amber-700'
            : 'bg-gradient-to-br from-rose-500 via-amber-600 to-yellow-600 border-amber-300'
      }`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Admin</p>
              <p className="text-white text-4xl font-bold mt-1">{adminCount}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          
          
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

    </div>
  );
}

export default HousekeeperStats;