// ============================================================
// PULSEGRID — UI: CARD COMPONENT
// ============================================================
import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glass?: boolean;
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
  glass = false,
}) => (
  <div
    className={clsx(
      glass
        ? 'bg-white/5 backdrop-blur-xl border border-white/10'
        : 'bg-gray-900/80 border border-gray-800',
      'rounded-2xl',
      paddingClasses[padding],
      hover && 'transition-all duration-300 hover:border-health-blue/40 hover:shadow-lg hover:shadow-health-blue/5 cursor-pointer',
      className
    )}
  >
    {children}
  </div>
);

export default Card;
