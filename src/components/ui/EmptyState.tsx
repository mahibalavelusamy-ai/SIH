import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  children,
  className = '',
}) => {
  return (
    <div
      className={`p-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        <h4 className="text-xs font-bold text-slate-800 tracking-tight font-heading">
          {title}
        </h4>
        <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
          {description}
        </p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs"
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  );
};

