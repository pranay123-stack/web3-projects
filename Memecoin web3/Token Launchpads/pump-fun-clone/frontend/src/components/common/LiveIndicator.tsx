'use client';

interface LiveIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LiveIndicator = ({ size = 'md' }: LiveIndicatorProps) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <span className="relative flex">
      <span
        className={`${sizeClasses[size]} bg-neon-green rounded-full animate-ping absolute opacity-75`}
      />
      <span className={`${sizeClasses[size]} bg-neon-green rounded-full relative`} />
    </span>
  );
};

export default LiveIndicator;
