import React, { ReactNode } from 'react';

export interface TimelineItem {
  id: string;
  timestamp: string;
  title: string;
  subtitle?: string;
  actor?: string;
  role?: string;
  description?: string;
  status?: string;
  badge?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400 font-mono">
        No timeline events recorded.
      </div>
    );
  }

  return (
    <div className={`relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 ${className}`}>
      {items.map((item) => (
        <div key={item.id} className="relative group text-xs">
          {/* Dot */}
          <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-white border-2 border-slate-400 group-hover:border-blue-600 transition-colors" />

          <div className="space-y-1 pl-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 tracking-tight">
                {item.title}
              </span>
              <span className="font-mono text-[10px] text-slate-400 shrink-0">
                {item.timestamp.replace('T', ' ').slice(0, 19)}
              </span>
            </div>

            {(item.actor || item.role || item.badge) && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-sans">
                {item.actor && <span>by <strong className="text-slate-700">{item.actor}</strong></span>}
                {item.role && <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">{item.role}</span>}
                {item.badge}
              </div>
            )}

            {item.description && (
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

