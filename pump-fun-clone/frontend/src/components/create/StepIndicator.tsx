'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, FileText, Image, Eye, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateTokenStep } from '@/hooks/useCreateToken';

interface Step {
  id: CreateTokenStep;
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { id: 'details', label: 'Details', icon: <FileText className="w-5 h-5" /> },
  { id: 'image', label: 'Image', icon: <Image className="w-5 h-5" /> },
  { id: 'preview', label: 'Preview', icon: <Eye className="w-5 h-5" /> },
  { id: 'launch', label: 'Launch', icon: <Rocket className="w-5 h-5" /> },
];

interface StepIndicatorProps {
  currentStep: CreateTokenStep;
  onStepClick?: (step: CreateTokenStep) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
}) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full py-6">
      {/* Desktop layout */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-dark-700 -translate-y-1/2 z-0" />

        {/* Animated progress line */}
        <motion.div
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-neon-green to-neon-purple -translate-y-1/2 z-0"
          initial={{ width: '0%' }}
          animate={{
            width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = index <= currentIndex;

          return (
            <motion.button
              key={step.id}
              className={cn(
                'relative z-10 flex flex-col items-center gap-2 group',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-not-allowed opacity-50'
              )}
              onClick={() => isClickable && onStepClick?.(step.id)}
              whileHover={isClickable ? { scale: 1.05 } : {}}
              whileTap={isClickable ? { scale: 0.95 } : {}}
            >
              {/* Step circle */}
              <motion.div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  'border-2 transition-all duration-300',
                  isCompleted && 'bg-neon-green border-neon-green text-black',
                  isCurrent && 'bg-dark-800 border-neon-green text-neon-green shadow-neon-green',
                  !isCompleted && !isCurrent && 'bg-dark-800 border-dark-600 text-gray-500'
                )}
                animate={
                  isCurrent
                    ? {
                        boxShadow: [
                          '0 0 0 rgba(0, 255, 136, 0.4)',
                          '0 0 20px rgba(0, 255, 136, 0.4)',
                          '0 0 0 rgba(0, 255, 136, 0.4)',
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <Check className="w-6 h-6" />
                  </motion.div>
                ) : (
                  step.icon
                )}
              </motion.div>

              {/* Step label */}
              <span
                className={cn(
                  'text-sm font-medium transition-colors duration-300',
                  isCompleted && 'text-neon-green',
                  isCurrent && 'text-white',
                  !isCompleted && !isCurrent && 'text-gray-500'
                )}
              >
                {step.label}
              </span>

              {/* Step number badge */}
              <span
                className={cn(
                  'absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold',
                  'flex items-center justify-center',
                  isCompleted && 'bg-neon-green text-black',
                  isCurrent && 'bg-neon-purple text-white',
                  !isCompleted && !isCurrent && 'bg-dark-600 text-gray-400'
                )}
              >
                {index + 1}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile layout */}
      <div className="md:hidden">
        {/* Progress bar */}
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-green to-neon-purple"
            initial={{ width: '0%' }}
            animate={{
              width: `${((currentIndex + 1) / STEPS.length) * 100}%`,
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        {/* Current step info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'bg-dark-800 border-2 border-neon-green text-neon-green'
              )}
            >
              {STEPS[currentIndex].icon}
            </div>
            <div>
              <p className="text-xs text-gray-400">
                Step {currentIndex + 1} of {STEPS.length}
              </p>
              <p className="text-white font-medium">{STEPS[currentIndex].label}</p>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((step, index) => (
              <motion.button
                key={step.id}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all duration-300',
                  index < currentIndex && 'bg-neon-green',
                  index === currentIndex && 'bg-neon-purple w-6',
                  index > currentIndex && 'bg-dark-600'
                )}
                onClick={() => index <= currentIndex && onStepClick?.(step.id)}
                whileHover={index <= currentIndex ? { scale: 1.2 } : {}}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
