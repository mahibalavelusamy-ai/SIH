import React from 'react';

export type StatusType =
  | 'ACCEPTED'
  | 'FLAGGED'
  | 'REJECTED'
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'LEGITIMATE_TRANSFER'
  | 'NOT_A_MATCH'
  | 'NEEDS_INFO'
  | 'CONFIRMED_DUPLICATE'
  | 'VERIFIED'
  | 'NOT_VERIFIED'
  | 'UNABLE_TO_VERIFY'
  | 'COMPLIANT'
  | 'REGULAR_EXCESS'
  | 'ACTIVE'
  | 'TRANSFERRED'
  | 'WITHDRAWN';

interface StatusIndicatorProps {
  status: StatusType | string;
  label?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'sm',
  showDot = true,
  className = '',
}) => {
  const normStatus = (status || '').toUpperCase().replace(/\s+/g, '_');

  const getStyle = () => {
    switch (normStatus) {
      case 'ACCEPTED':
      case 'VERIFIED':
      case 'COMPLIANT':
      case 'LEGITIMATE_TRANSFER':
        return {
          bg: 'bg-teal-500/10 text-teal-700 border-teal-500/20',
          dot: 'bg-teal-500',
        };
      case 'FLAGGED':
      case 'PENDING':
      case 'PENDING_REVIEW':
      case 'NEEDS_INFO':
      case 'UNABLE_TO_VERIFY':
        return {
          bg: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
          dot: 'bg-amber-500',
        };
      case 'REJECTED':
      case 'NOT_VERIFIED':
      case 'REGULAR_EXCESS':
      case 'CONFIRMED_DUPLICATE':
        return {
          bg: 'bg-rose-500/10 text-rose-800 border-rose-500/20',
          dot: 'bg-rose-500',
        };
      case 'ACTIVE':
      case 'NOT_A_MATCH':
        return {
          bg: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
          dot: 'bg-blue-500',
        };
      case 'TRANSFERRED':
      case 'WITHDRAWN':
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
          dot: 'bg-slate-400',
        };
    }
  };

  const style = getStyle();
  const displayLabel = label || normStatus.replace(/_/g, ' ');

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1.5'
      : 'px-2.5 py-1 text-xs gap-2';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border tracking-tight ${sizeClasses} ${style.bg} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};

