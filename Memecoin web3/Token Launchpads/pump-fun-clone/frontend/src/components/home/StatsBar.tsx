'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import {
  Rocket,
  TrendingUp,
  Users,
  Coins,
  DollarSign,
  BarChart3,
} from 'lucide-react';

interface Stat {
  label: string;
  value: number;
  displayValue: string;
  icon: React.ElementType;
  color: string;
  prefix?: string;
  suffix?: string;
}

interface StatsBarProps {
  className?: string;
}

const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}> = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => {
    if (current >= 1e9) {
      return `${prefix}${(current / 1e9).toFixed(decimals)}B${suffix}`;
    }
    if (current >= 1e6) {
      return `${prefix}${(current / 1e6).toFixed(decimals)}M${suffix}`;
    }
    if (current >= 1e3) {
      return `${prefix}${(current / 1e3).toFixed(decimals)}K${suffix}`;
    }
    return `${prefix}${current.toFixed(0)}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};

const defaultStats: Stat[] = [
  {
    label: 'Total Tokens',
    value: 125430,
    displayValue: '125,430',
    icon: Rocket,
    color: 'text-neon-green',
  },
  {
    label: 'Total Volume',
    value: 2400000000,
    displayValue: '$2.4B',
    icon: DollarSign,
    color: 'text-neon-purple',
    prefix: '$',
  },
  {
    label: 'Active Users',
    value: 89000,
    displayValue: '89,000',
    icon: Users,
    color: 'text-cyan-400',
  },
  {
    label: 'Tokens Graduated',
    value: 8420,
    displayValue: '8,420',
    icon: TrendingUp,
    color: 'text-yellow-400',
  },
  {
    label: 'Market Cap',
    value: 580000000,
    displayValue: '$580M',
    icon: BarChart3,
    color: 'text-emerald-400',
    prefix: '$',
  },
  {
    label: 'Total Holders',
    value: 2100000,
    displayValue: '2.1M',
    icon: Coins,
    color: 'text-orange-400',
  },
];

export const StatsBar: React.FC<StatsBarProps> = ({ className }) => {
  const [stats, setStats] = useState<Stat[]>(defaultStats);
  const [isVisible, setIsVisible] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prevStats) =>
        prevStats.map((stat) => ({
          ...stat,
          value: stat.value + Math.floor(Math.random() * 100),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Intersection observer for animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('stats-bar');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="stats-bar" className={className}>
      <div className="relative overflow-hidden bg-dark-card/50 backdrop-blur-sm border-y border-gray-800 py-8">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-neon-green/5 via-transparent to-neon-purple/5" />

        {/* Animated background line */}
        <motion.div
          className="absolute top-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-neon-green to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-neon-green/10 to-neon-purple/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative bg-dark-bg/50 rounded-xl p-4 border border-gray-800 group-hover:border-gray-700 transition-colors">
                  {/* Icon */}
                  <div className={`${stat.color} mb-2`}>
                    <stat.icon className="w-5 h-5" />
                  </div>

                  {/* Value */}
                  <div className="text-2xl font-bold text-white mb-1">
                    <AnimatedNumber
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      decimals={1}
                    />
                  </div>

                  {/* Label */}
                  <div className="text-xs text-gray-400">{stat.label}</div>

                  {/* Live indicator */}
                  <motion.div
                    className="absolute top-2 right-2 w-1.5 h-1.5 bg-neon-green rounded-full"
                    animate={{
                      opacity: [1, 0.3, 1],
                      scale: [1, 0.8, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom animated line */}
        <motion.div
          className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-neon-purple to-transparent"
          initial={{ x: '100%' }}
          animate={{ x: '-100%' }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    </section>
  );
};

export default StatsBar;
