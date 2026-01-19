'use client';

import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateImage } from '@/lib/validation';

interface ImageUploadStepProps {
  imagePreview: string | null;
  error?: string;
  setImage: (file: File | null, preview: string | null) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const ImageUploadStep: React.FC<ImageUploadStepProps> = ({
  imagePreview,
  error,
  setImage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setLocalError(null);

      // Validate file
      const validation = validateImage(file);
      if (!validation.isValid) {
        setLocalError(validation.error || 'Invalid file');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(file, e.target?.result as string);
      };
      reader.onerror = () => {
        setLocalError('Failed to read file');
      };
      reader.readAsDataURL(file);
    },
    [setImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleRemoveImage = useCallback(() => {
    setImage(null, null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setImage]);

  const handleGenerateAI = useCallback(async () => {
    if (!aiPrompt.trim()) {
      setLocalError('Please enter a prompt for AI generation');
      return;
    }

    setIsGenerating(true);
    setLocalError(null);

    try {
      // Simulated AI generation - replace with actual API call
      // Example: OpenAI DALL-E, Stability AI, etc.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo purposes, show a placeholder
      // In production, you'd call an AI image generation API
      setLocalError(
        'AI generation requires API integration. Please upload an image manually.'
      );
    } catch (err) {
      setLocalError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt]);

  const displayError = localError || error;

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
          Token Image
        </motion.h2>
        <p className="text-gray-400">
          Upload a memorable image for your token
        </p>
      </div>

      {/* Upload area */}
      <AnimatePresence mode="wait">
        {imagePreview ? (
          <motion.div
            key="preview"
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {/* Image preview */}
            <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-neon-green/50 shadow-neon-green">
              <img
                src={imagePreview}
                alt="Token preview"
                className="w-full h-full object-cover"
              />

              {/* Success badge */}
              <motion.div
                className="absolute top-3 right-3 bg-neon-green text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle className="w-4 h-4" />
                Ready
              </motion.div>

              {/* Remove button */}
              <motion.button
                className="absolute top-3 left-3 bg-dark-900/80 hover:bg-red-500/80 text-white p-2 rounded-full transition-colors"
                onClick={handleRemoveImage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Change image button */}
            <div className="mt-4 text-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-neon-green hover:text-neon-green-dark transition-colors text-sm flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Change Image
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {/* Drop zone */}
            <div
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300',
                'flex flex-col items-center justify-center min-h-[300px]',
                isDragging
                  ? 'border-neon-green bg-neon-green/5 scale-[1.02]'
                  : 'border-dark-600 hover:border-neon-green/50 hover:bg-dark-800/50',
                displayError && 'border-red-500'
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                animate={
                  isDragging
                    ? {
                        background: [
                          'radial-gradient(circle at 0% 0%, rgba(0, 255, 136, 0.1) 0%, transparent 50%)',
                          'radial-gradient(circle at 100% 100%, rgba(0, 255, 136, 0.1) 0%, transparent 50%)',
                          'radial-gradient(circle at 0% 0%, rgba(0, 255, 136, 0.1) 0%, transparent 50%)',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Upload icon */}
              <motion.div
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center mb-4',
                  'bg-dark-700 border-2',
                  isDragging ? 'border-neon-green' : 'border-dark-600'
                )}
                animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Upload
                  className={cn(
                    'w-10 h-10 transition-colors',
                    isDragging ? 'text-neon-green' : 'text-gray-400'
                  )}
                />
              </motion.div>

              {/* Instructions */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {isDragging ? 'Drop your image here' : 'Drag & drop your image'}
              </h3>
              <p className="text-gray-400 text-sm mb-4">or click to browse</p>

              {/* File button */}
              <motion.button
                className="px-6 py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-white font-medium transition-colors flex items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ImageIcon className="w-5 h-5" />
                Choose File
              </motion.button>

              {/* File requirements */}
              <p className="text-gray-500 text-xs mt-4">
                JPG, PNG, GIF, or WebP (max {MAX_SIZE_MB}MB)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {displayError && (
        <motion.div
          className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{displayError}</p>
        </motion.div>
      )}

      {/* AI Generation section */}
      <div className="border-t border-dark-700 pt-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-neon-purple" />
          AI Image Generation
          <span className="text-xs font-normal text-gray-500 bg-dark-700 px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        </h3>

        <div className="space-y-3">
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe the image you want to generate... (e.g., 'A cute cartoon rocket heading to the moon with gold coins')"
            rows={3}
            disabled={isGenerating}
            className={cn(
              'w-full px-4 py-3 rounded-xl bg-dark-800 border-2 border-dark-600',
              'text-white placeholder-gray-500 resize-none',
              'transition-all duration-300 outline-none',
              'focus:border-neon-purple/50 focus:ring-2 focus:ring-neon-purple/20',
              'disabled:opacity-50'
            )}
          />

          <motion.button
            className={cn(
              'w-full px-6 py-3 rounded-xl font-medium transition-all',
              'bg-gradient-to-r from-neon-purple to-neon-pink',
              'text-white shadow-neon-purple hover:shadow-neon-pink',
              'flex items-center justify-center gap-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            onClick={handleGenerateAI}
            disabled={isGenerating || !aiPrompt.trim()}
            whileHover={{ scale: isGenerating ? 1 : 1.02 }}
            whileTap={{ scale: isGenerating ? 1 : 0.98 }}
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-5 h-5" />
                </motion.div>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate with AI
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Tips */}
      <motion.div
        className="p-4 rounded-xl bg-dark-800/50 border border-dark-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h4 className="text-sm font-semibold text-neon-green mb-2">Image Tips</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Use a square image for best results (1:1 ratio)</li>
          <li>• High resolution images look better (512x512 or larger)</li>
          <li>• Make it memorable and unique to stand out</li>
          <li>• Avoid copyrighted or trademarked images</li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default ImageUploadStep;
