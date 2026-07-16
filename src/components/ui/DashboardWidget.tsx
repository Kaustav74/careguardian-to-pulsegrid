// ============================================================
// PULSEGRID — UI: DASHBOARD WIDGET
// ============================================================
import React from 'react';
import clsx from 'clsx';

interface DashboardWidgetProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  trend?: { value: number; label: string };
  action?: { label: string; onClick: () => void };
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'text-health-blue',
  trend,
  action,
  children,
  className,
  size = 'md',
}) => {
  const trendPositive = (trend?.value ?? 0) >= 0;

  return (
    <div
      className={clsx(
        'bg-gray-900/80 border border-gray-800 rounded-2xl p-5',
        'transition-all duration-300 hover:border-health-blue/30 hover:shadow-lg hover:shadow-health-blue/5',
        'animate-slide-in-up',
        size === 'lg' && 'col-span-2',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
          {value !== undefined && (
            <p className="text-2xl font-bold text-white">{value}</p>
          )}
          {subtitle && (
            <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={clsx('w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl', iconColor)}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className={clsx('flex items-center gap-1 text-xs font-medium mt-2', trendPositive ? 'text-calm-green' : 'text-red-400')}>
          <span>{trendPositive ? '▲' : '▼'}</span>
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-xs text-health-blue hover:text-blue-400 font-medium transition-colors"
        >
          {action.label} →
        </button>
      )}
    </div>
  );
};

export default DashboardWidget;
