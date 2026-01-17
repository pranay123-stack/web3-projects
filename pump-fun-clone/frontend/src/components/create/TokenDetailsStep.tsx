'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  Hash,
  FileText,
  Twitter,
  Send,
  Globe,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TokenFormData } from '@/lib/validation';

interface TokenDetailsStepProps {
  formData: TokenFormData;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  updateField: <K extends keyof TokenFormData>(field: K, value: TokenFormData[K]) => void;
  touchField: (field: keyof TokenFormData) => void;
  validateField: (field: keyof TokenFormData) => string | undefined;
}

interface InputFieldProps {
  label: string;
  name: keyof TokenFormData;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
  touched?: boolean;
  required?: boolean;
  maxLength?: number;
  description?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  placeholder,
  icon,
  error,
  touched,
  required,
  maxLength,
  description,
  multiline,
  onChange,
  onBlur,
}) => {
  const showError = touched && error;
  const showSuccess = touched && !error && value.length > 0;

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-medium text-gray-300 flex items-center gap-2">
          {icon}
          {label}
          {required && <span className="text-neon-pink">*</span>}
        </label>
        {maxLength && (
          <span
            className={cn(
              'text-xs',
              value.length > maxLength ? 'text-red-400' : 'text-gray-500'
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      <div className="relative">
        {multiline ? (
          <textarea
            id={name}
            value={value}
            placeholder={placeholder}
            rows={4}
            maxLength={maxLength}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={cn(
              'w-full px-4 py-3 rounded-xl bg-dark-800 border-2',
              'text-white placeholder-gray-500 resize-none',
              'transition-all duration-300 outline-none',
              'focus:ring-2 focus:ring-neon-green/20',
              showError && 'border-red-500 focus:border-red-500',
              showSuccess && 'border-neon-green/50 focus:border-neon-green',
              !showError && !showSuccess && 'border-dark-600 focus:border-neon-green/50'
            )}
          />
        ) : (
          <input
            id={name}
            type="text"
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={cn(
              'w-full px-4 py-3 rounded-xl bg-dark-800 border-2',
              'text-white placeholder-gray-500',
              'transition-all duration-300 outline-none',
              'focus:ring-2 focus:ring-neon-green/20',
              showError && 'border-red-500 focus:border-red-500',
              showSuccess && 'border-neon-green/50 focus:border-neon-green',
              !showError && !showSuccess && 'border-dark-600 focus:border-neon-green/50'
            )}
          />
        )}

        {/* Status icon */}
        <div className="absolute right-3 top-3">
          {showError && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-red-500"
            >
              <AlertCircle className="w-5 h-5" />
            </motion.div>
          )}
          {showSuccess && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-neon-green"
            >
              <CheckCircle className="w-5 h-5" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Error or description */}
      {showError ? (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-red-400 text-sm flex items-center gap-1"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.p>
      ) : (
        description && <p className="text-gray-500 text-sm">{description}</p>
      )}
    </motion.div>
  );
};

export const TokenDetailsStep: React.FC<TokenDetailsStepProps> = ({
  formData,
  errors,
  touched,
  updateField,
  touchField,
  validateField,
}) => {
  const handleChange = useCallback(
    (field: keyof TokenFormData) => (value: string) => {
      // For symbol, automatically uppercase
      if (field === 'symbol') {
        value = value.toUpperCase();
      }
      updateField(field, value);
    },
    [updateField]
  );

  const handleBlur = useCallback(
    (field: keyof TokenFormData) => () => {
      touchField(field);
      validateField(field);
    },
    [touchField, validateField]
  );

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h2
          className="text-2xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Token Details
        </motion.h2>
        <p className="text-gray-400">
          Enter the basic information for your token
        </p>
      </div>

      {/* Required fields */}
      <div className="space-y-5">
        <InputField
          label="Token Name"
          name="name"
          value={formData.name}
          placeholder="e.g., Moon Coin"
          icon={<Coins className="w-4 h-4" />}
          error={errors.name}
          touched={touched.name}
          required
          maxLength={32}
          description="Choose a memorable name for your token"
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
        />

        <InputField
          label="Token Symbol"
          name="symbol"
          value={formData.symbol}
          placeholder="e.g., MOON"
          icon={<Hash className="w-4 h-4" />}
          error={errors.symbol}
          touched={touched.symbol}
          required
          maxLength={10}
          description="A short ticker symbol (will be uppercase)"
          onChange={handleChange('symbol')}
          onBlur={handleBlur('symbol')}
        />

        <InputField
          label="Description"
          name="description"
          value={formData.description}
          placeholder="Describe your token and its purpose..."
          icon={<FileText className="w-4 h-4" />}
          error={errors.description}
          touched={touched.description}
          required
          maxLength={500}
          multiline
          description="Tell people what makes your token special"
          onChange={handleChange('description')}
          onBlur={handleBlur('description')}
        />
      </div>

      {/* Optional social links */}
      <div className="pt-6 border-t border-dark-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-neon-purple" />
          Social Links
          <span className="text-sm font-normal text-gray-500">(Optional)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Twitter"
            name="twitter"
            value={formData.twitter || ''}
            placeholder="@username or URL"
            icon={<Twitter className="w-4 h-4" />}
            error={errors.twitter}
            touched={touched.twitter}
            onChange={handleChange('twitter')}
            onBlur={handleBlur('twitter')}
          />

          <InputField
            label="Telegram"
            name="telegram"
            value={formData.telegram || ''}
            placeholder="@group or URL"
            icon={<Send className="w-4 h-4" />}
            error={errors.telegram}
            touched={touched.telegram}
            onChange={handleChange('telegram')}
            onBlur={handleBlur('telegram')}
          />
        </div>

        <div className="mt-4">
          <InputField
            label="Website"
            name="website"
            value={formData.website || ''}
            placeholder="https://yourwebsite.com"
            icon={<Globe className="w-4 h-4" />}
            error={errors.website}
            touched={touched.website}
            onChange={handleChange('website')}
            onBlur={handleBlur('website')}
          />
        </div>
      </div>

      {/* Tips */}
      <motion.div
        className="p-4 rounded-xl bg-dark-800/50 border border-dark-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h4 className="text-sm font-semibold text-neon-green mb-2">Pro Tips</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Choose a unique and memorable name</li>
          <li>• Keep the symbol short (3-5 characters work best)</li>
          <li>• Write a compelling description to attract buyers</li>
          <li>• Add social links to build trust with your community</li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default TokenDetailsStep;
