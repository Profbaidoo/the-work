import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  colorScheme?: 'amber' | 'teal' | 'blue' | 'emerald' | 'purple' | 'red';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorScheme = 'blue'
}) => {
  const colorMap = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', iconBg: 'bg-amber-500 text-slate-950' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', iconBg: 'bg-teal-600 text-white' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-600 text-white' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', iconBg: 'bg-emerald-600 text-white' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-600 text-white' },
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', iconBg: 'bg-red-600 text-white' },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-xs ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};
