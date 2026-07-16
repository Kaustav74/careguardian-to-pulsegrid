// ============================================================
// PULSEGRID — UI: AVATAR COMPONENT
// ============================================================
import React from 'react';
import clsx from 'clsx';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
  online?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function getGradient(name?: string): string {
  const gradients = [
    'from-health-blue to-blue-500',
    'from-calm-green to-emerald-500',
    'from-purple-600 to-violet-500',
    'from-pink-600 to-rose-500',
    'from-orange-500 to-amber-500',
    'from-cyan-600 to-sky-500',
  ];
  if (!name) return gradients[0];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
  online,
}) => (
  <div className={clsx('relative inline-flex flex-shrink-0', className)}>
    {src ? (
      <img
        src={src}
        alt={name ?? 'avatar'}
        className={clsx('rounded-full object-cover ring-2 ring-gray-800', sizeClasses[size])}
      />
    ) : (
      <div
        className={clsx(
          'rounded-full bg-gradient-to-br flex items-center justify-center',
          'font-bold text-white ring-2 ring-gray-800',
          getGradient(name),
          sizeClasses[size]
        )}
      >
        {getInitials(name)}
      </div>
    )}
    {online !== undefined && (
      <span
        className={clsx(
          'absolute bottom-0 right-0 rounded-full border-2 border-gray-900',
          'w-2.5 h-2.5',
          online ? 'bg-calm-green' : 'bg-gray-500'
        )}
      />
    )}
  </div>
);

export default Avatar;
