// ============================================================
// PULSEGRID — UI: BADGE COMPONENT
// ============================================================
import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-calm-green/20 text-calm-green   border-calm-green/30',
  warning: 'bg-yellow-500/20 text-yellow-400   border-yellow-500/30',
  danger:  'bg-red-500/20   text-red-400      border-red-500/30',
  info:    'bg-health-blue/20 text-blue-300   border-health-blue/30',
  neutral: 'bg-gray-700/50  text-gray-400     border-gray-600',
  purple:  'bg-purple-500/20 text-purple-400  border-purple-500/30',
};

const dotClasses: Record<BadgeVariant, string> = {
  success: 'bg-calm-green',
  warning: 'bg-yellow-400',
  danger:  'bg-red-400',
  info:    'bg-blue-400',
  neutral: 'bg-gray-400',
  purple:  'bg-purple-400',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  dot = false,
}) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 border text-xs font-semibold px-2.5 py-0.5 rounded-full',
      variantClasses[variant],
      className
    )}
  >
    {dot && (
      <span className={clsx('w-1.5 h-1.5 rounded-full', dotClasses[variant])} />
    )}
    {children}
  </span>
);

export default Badge;
