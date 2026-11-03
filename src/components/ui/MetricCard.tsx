import React, { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNegative?: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'neutral' | 'teal' | 'amber' | 'rose' | 'indigo';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  tone = 'neutral',
  onClick,
  className = '',
}) => {
  const getToneClasses = () => {
    switch (tone) {
      case 'teal':
        return 'border-teal-500/20 bg-teal-50/15 text-teal-900';
      case 'amber':
        return 'border-amber-500/20 bg-amber-50/15 text-amber-900';
      case 'rose':
        return 'border-rose-500/20 bg-rose-50/15 text-rose-900';
      case 'indigo':
        return 'border-indigo-500/20 bg-indigo-50/15 text-indigo-900';
      case 'neutral':
      default:
        return 'border-slate-200/80 bg-white text-slate-900';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border transition-all duration-150 flex flex-col justify-between ${getToneClasses()} ${
        onClick
          ? 'cursor-pointer hover:border-slate-400/60 hover:shadow-2xs active:scale-[0.99]'
          : 'shadow-2xs'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500 truncate">
          {label}
        </span>
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xl font-bold font-mono tracking-tight tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border ${
              trend.isPositive
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : trend.isNegative
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subValue && (
        <span className="text-[10px] text-slate-400 mt-1 truncate font-sans">
          {subValue}
        </span>
      )}
    </div>
  );
};

