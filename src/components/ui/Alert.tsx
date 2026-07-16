// ============================================================
// PULSEGRID — UI: ALERT COMPONENT
// ============================================================
import React, { useState } from 'react';
import clsx from 'clsx';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  dismissible?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; title: string; text: string; defaultIcon: string }> = {
  info:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   title: 'text-blue-300',  text: 'text-blue-200',  defaultIcon: 'ℹ' },
  success: { bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',title: 'text-emerald-300',text: 'text-emerald-200',defaultIcon: '' },
  warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', title: 'text-yellow-300',text: 'text-yellow-200',defaultIcon: '' },
  error:   { bg: 'bg-red-500/10',    border: 'border-red-500/30',    title: 'text-red-300',   text: 'text-red-200',   defaultIcon: '' },
};

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  dismissible = false,
  className,
  icon,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const cfg = variantConfig[variant];

  if (dismissed) return null;

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border',
        cfg.bg, cfg.border,
        className
      )}
      role="alert"
    >
      <span className={clsx('text-lg leading-none mt-0.5', cfg.title)}>
        {icon ?? cfg.defaultIcon}
      </span>
      <div className="flex-1 min-w-0">
        {title && <p className={clsx('text-sm font-semibold', cfg.title)}>{title}</p>}
        <p className={clsx('text-sm', cfg.text)}>{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className={clsx('text-sm hover:opacity-75', cfg.text)}
          aria-label="Dismiss"
        >
          
        </button>
      )}
    </div>
  );
};

export default Alert;
