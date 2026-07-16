// ============================================================
// PULSEGRID — UI: SKELETON COMPONENT
// ============================================================
import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
  count?: number;
  gap?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  count = 1,
  gap = 'gap-2',
}) => {
  const items = Array.from({ length: count });
  return (
    <div className={clsx('flex flex-col', gap)}>
      {items.map((_, i) => (
        <div
          key={i}
          className={clsx('bg-gray-800 rounded-lg animate-pulse', className)}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 space-y-3">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2">
    <Skeleton className="h-10 w-full rounded-xl" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-14 w-full rounded-xl" />
    ))}
  </div>
);

export default Skeleton;
