import React, { ReactNode } from 'react';
import { Filter } from 'lucide-react';

interface FilterItem {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  width?: string;
}

interface FilterBarProps {
  filters?: FilterItem[];
  children?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  children,
  rightAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono px-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="uppercase text-[10px] font-bold tracking-wider text-slate-500">
            Filters:
          </span>
        </div>

        {filters &&
          filters.map((f) => (
            <div key={f.id} className="relative">
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                style={f.width ? { maxWidth: f.width } : undefined}
                className="h-7 text-xs bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200 rounded px-2 text-slate-700 font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer truncate"
              >
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

        {children}
      </div>

      {rightAction && (
        <div className="flex items-center gap-2 shrink-0">
          {rightAction}
        </div>
      )}
    </div>
  );
};

