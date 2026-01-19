'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  Rocket,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  Pause,
  Play,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useLiveFeed, Activity as ActivityType, ActivityType as ActivityTypeEnum } from '@/hooks/useLiveFeed';
import { formatNumber, shortenAddress, formatTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface LiveFeedProps {
  maxItems?: number;
  compact?: boolean;
  className?: string;
}

const getActivityIcon = (type: ActivityTypeEnum) => {
  switch (type) {
    case 'new_token':
      return Rocket;
    case 'buy':
      return ArrowUp;
    case 'sell':
      return ArrowDown;
    case 'graduated':
      return GraduationCap;
    default:
      return Activity;
  }
};

const getActivityColor = (type: ActivityTypeEnum) => {
  switch (type) {
    case 'new_token':
      return 'text-neon-purple bg-neon-purple/10 border-neon-purple/30';
    case 'buy':
      return 'text-neon-green bg-neon-green/10 border-neon-green/30';
    case 'sell':
      return 'text-red-500 bg-red-500/10 border-red-500/30';
    case 'graduated':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    default:
      return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
  }
};

const getActivityMessage = (activity: ActivityType): string => {
  switch (activity.type) {
    case 'new_token':
      return `created ${activity.token.name}`;
    case 'buy':
      return `bought ${formatNumber(activity.amount || 0)} ${activity.token.symbol}`;
    case 'sell':
      return `sold ${formatNumber(activity.amount || 0)} ${activity.token.symbol}`;
    case 'graduated':
      return `${activity.token.name} graduated!`;
    default:
      return 'activity';
  }
};

const ActivityItem: React.FC<{ activity: ActivityType; compact?: boolean }> = ({
  activity,
  compact = false,
}) => {
  const Icon = getActivityIcon(activity.type);
  const colorClass = getActivityColor(activity.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl bg-dark-card/50 border border-gray-800 hover:border-gray-700 transition-colors',
        compact ? 'p-2' : 'p-3'
      )}
    >
      {/* Activity icon */}
      <div className={cn('p-2 rounded-lg border', colorClass)}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Token image */}
      <Link href={`/token/${activity.token.address}`} className="flex-shrink-0">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden ring-2 ring-gray-700 hover:ring-neon-green/50 transition-all">
          <Image
            src={activity.token.image}
            alt={activity.token.name}
            fill
            className="object-cover"
          />
        </div>
      </Link>

      {/* Activity details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          {activity.user && (
            <>
              <Link
                href={`/profile/${activity.user.address}`}
                className="text-gray-300 hover:text-neon-green transition-colors font-medium truncate max-w-[80px]"
              >
                {shortenAddress(activity.user.address)}
              </Link>
              <span className="text-gray-500">{getActivityMessage(activity)}</span>
            </>
          )}
          {!activity.user && activity.type === 'graduated' && (
            <span className="text-yellow-400 font-medium">{getActivityMessage(activity)}</span>
          )}
        </div>

        {/* Amount/Price info */}
        {activity.solAmount && (
          <div className="text-xs text-gray-400 mt-0.5">
            {activity.solAmount.toFixed(2)} SOL
            {activity.type === 'buy' && (
              <span className="text-neon-green ml-1">+{((activity.solAmount / 100) * 2.5).toFixed(3)} SOL fee</span>
            )}
          </div>
        )}
      </div>

      {/* Token link */}
      <Link
        href={`/token/${activity.token.address}`}
        className="flex-shrink-0 text-right"
      >
        <div className="text-sm font-medium text-white hover:text-neon-green transition-colors">
          ${activity.token.symbol}
        </div>
        <div className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</div>
      </Link>
    </motion.div>
  );
};

export const LiveFeed: React.FC<LiveFeedProps> = ({
  maxItems = 20,
  compact = false,
  className,
}) => {
  const { activities, isConnected, isPaused, pause, resume } = useLiveFeed({
    maxItems,
  });
  const feedRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-pause when hovered
  useEffect(() => {
    if (isHovered && !isPaused) {
      pause();
    } else if (!isHovered && isPaused) {
      resume();
    }
  }, [isHovered, isPaused, pause, resume]);

  return (
    <section className={cn('py-12', className)}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <Activity className="w-6 h-6 text-neon-green" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">Live Activity</h2>
            <div className="flex items-center gap-2 ml-4">
              {isConnected ? (
                <div className="flex items-center gap-1.5 text-xs text-neon-green">
                  <motion.div
                    className="w-2 h-2 bg-neon-green rounded-full"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <button
            onClick={() => (isPaused ? resume() : pause())}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-card border border-gray-700 hover:border-gray-600 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            )}
          </button>
        </div>

        {/* Feed container */}
        <div
          ref={feedRef}
          className="relative bg-dark-card/30 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Gradient overlays for scroll fade */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-dark-card/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-dark-card/80 to-transparent z-10 pointer-events-none" />

          {/* Activities list */}
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <AnimatePresence mode="popLayout" initial={false}>
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  compact={compact}
                />
              ))}
            </AnimatePresence>

            {activities.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Waiting for activity...</p>
              </div>
            )}
          </div>

          {/* Pause overlay */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-dark-bg/50 backdrop-blur-sm flex items-center justify-center z-20"
              >
                <div className="text-center">
                  <Pause className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Feed paused</p>
                  <button
                    onClick={resume}
                    className="mt-2 px-4 py-2 bg-neon-green/20 text-neon-green rounded-lg text-sm font-medium hover:bg-neon-green/30 transition-colors"
                  >
                    Resume
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Activity type legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          {[
            { type: 'new_token' as ActivityTypeEnum, label: 'New Token' },
            { type: 'buy' as ActivityTypeEnum, label: 'Buy' },
            { type: 'sell' as ActivityTypeEnum, label: 'Sell' },
            { type: 'graduated' as ActivityTypeEnum, label: 'Graduated' },
          ].map(({ type, label }) => {
            const Icon = getActivityIcon(type);
            const colorClass = getActivityColor(type);
            return (
              <div key={type} className="flex items-center gap-2 text-sm text-gray-400">
                <div className={cn('p-1.5 rounded-md border', colorClass)}>
                  <Icon className="w-3 h-3" />
                </div>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LiveFeed;
