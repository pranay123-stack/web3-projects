'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, TrendingUp, Users, Activity, ExternalLink } from 'lucide-react';
import { formatNumber, formatPrice, getPercentageColor, formatPercentage } from '@/lib/utils';
import { Token } from '@/hooks/useTrendingTokens';

interface KingOfTheHillProps {
  token?: Token;
  isLoading?: boolean;
}

const CrownAnimation = () => (
  <motion.div
    className="absolute -top-8 left-1/2 -translate-x-1/2"
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div
      animate={{
        rotate: [-5, 5, -5],
        y: [0, -5, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Crown className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
    </motion.div>
    {/* Crown sparkles */}
    <motion.div
      className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-400 rounded-full"
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay: 0,
      }}
    />
    <motion.div
      className="absolute -top-1 right-0 w-1.5 h-1.5 bg-yellow-400 rounded-full"
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay: 0.3,
      }}
    />
    <motion.div
      className="absolute top-2 -right-3 w-2 h-2 bg-yellow-400 rounded-full"
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay: 0.6,
      }}
    />
  </motion.div>
);

const LoadingSkeleton = () => (
  <div className="relative bg-gradient-to-br from-dark-card via-dark-card to-dark-card/50 rounded-3xl p-8 border border-gray-800">
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="relative">
        <div className="w-32 h-32 rounded-2xl bg-gray-700/50 animate-pulse" />
      </div>
      <div className="flex-1 space-y-4 text-center md:text-left">
        <div className="h-8 w-48 bg-gray-700/50 rounded animate-pulse mx-auto md:mx-0" />
        <div className="h-4 w-32 bg-gray-700/50 rounded animate-pulse mx-auto md:mx-0" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-16 bg-gray-700/50 rounded animate-pulse mx-auto md:mx-0" />
              <div className="h-6 w-24 bg-gray-700/50 rounded animate-pulse mx-auto md:mx-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const KingOfTheHill: React.FC<KingOfTheHillProps> = ({ token, isLoading }) => {
  if (isLoading || !token) {
    return (
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">King of the Hill</h2>
          </div>
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  const stats = [
    {
      label: 'Market Cap',
      value: `$${formatNumber(token.marketCap)}`,
      icon: TrendingUp,
    },
    {
      label: '24h Change',
      value: formatPercentage(token.priceChange24h),
      icon: Activity,
      colorClass: getPercentageColor(token.priceChange24h),
    },
    {
      label: 'Volume',
      value: `$${formatNumber(token.volume24h)}`,
      icon: Activity,
    },
    {
      label: 'Holders',
      value: formatNumber(token.holders, 0),
      icon: Users,
    },
  ];

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8"
        >
          <motion.div
            animate={{
              rotate: [-10, 10, -10],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Crown className="w-6 h-6 text-yellow-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white">King of the Hill</h2>
          <span className="text-sm text-gray-400 ml-2">Top performing token right now</span>
        </motion.div>

        {/* King card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-neon-green/10 to-yellow-400/20 rounded-3xl blur-2xl" />

          <Link href={`/token/${token.address}`}>
            <div className="relative bg-gradient-to-br from-dark-card via-dark-card to-yellow-900/10 rounded-3xl p-8 border border-yellow-400/30 hover:border-yellow-400/50 transition-colors overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23facc15' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              </div>

              <div className="relative flex flex-col md:flex-row items-center gap-8">
                {/* Token image with crown */}
                <div className="relative">
                  <CrownAnimation />
                  <motion.div
                    className="relative w-32 h-32 rounded-2xl overflow-hidden ring-4 ring-yellow-400/50 shadow-[0_0_40px_rgba(250,204,21,0.3)]"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Image
                      src={token.image}
                      alt={token.name}
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                  {/* Bonding curve progress */}
                  <div className="absolute -bottom-2 -right-2 bg-dark-bg rounded-full p-1">
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 transform -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="transparent"
                          className="text-gray-700"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="transparent"
                          strokeDasharray={`${token.bondingCurveProgress} 100`}
                          strokeLinecap="round"
                          className="text-yellow-400"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-yellow-400">
                        {Math.round(token.bondingCurveProgress)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Token info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h3 className="text-3xl font-bold text-white">{token.name}</h3>
                    <span className="text-lg text-gray-400">${token.symbol}</span>
                    {token.isGraduated && (
                      <span className="px-2 py-1 text-xs font-semibold bg-neon-green/20 text-neon-green rounded-full">
                        Graduated
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 mb-6 line-clamp-2">{token.description}</p>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                      <div key={stat.label} className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-1.5 text-gray-400 text-sm mb-1">
                          <stat.icon className="w-3.5 h-3.5" />
                          {stat.label}
                        </div>
                        <div className={`text-xl font-bold ${stat.colorClass || 'text-white'}`}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* View button */}
                <motion.div
                  className="hidden md:flex items-center gap-2 px-6 py-3 bg-yellow-400/10 border border-yellow-400/30 rounded-xl text-yellow-400 font-semibold"
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(250, 204, 21, 0.2)',
                  }}
                >
                  View Token
                  <ExternalLink className="w-4 h-4" />
                </motion.div>
              </div>

              {/* Price ticker */}
              <motion.div
                className="absolute top-4 right-4 px-4 py-2 bg-dark-bg/80 backdrop-blur-sm rounded-lg border border-gray-700"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-xs text-gray-400 mb-0.5">Price</div>
                <div className="text-lg font-bold text-white">
                  ${formatPrice(token.price)}
                </div>
              </motion.div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default KingOfTheHill;
