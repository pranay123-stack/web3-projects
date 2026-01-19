'use client';

import { useState, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  TokenFormData,
  validateTokenForm,
  validateTokenName,
  validateTokenSymbol,
  validateDescription,
  validateImage,
  validateTwitter,
  validateTelegram,
  validateUrl,
  getCostBreakdown,
} from '@/lib/validation';
import {
  tokenCreationService,
  TokenCreationProgress,
} from '@/services/tokenCreation';

export type CreateTokenStep = 'details' | 'image' | 'preview' | 'launch';

const STEPS: CreateTokenStep[] = ['details', 'image', 'preview', 'launch'];

export interface UseCreateTokenReturn {
  // Form state
  formData: TokenFormData;
  errors: Record<string, string>;
  touched: Record<string, boolean>;

  // Step management
  currentStep: CreateTokenStep;
  currentStepIndex: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: CreateTokenStep) => void;

  // Form updates
  updateField: <K extends keyof TokenFormData>(field: K, value: TokenFormData[K]) => void;
  setImage: (file: File | null, preview: string | null) => void;
  touchField: (field: keyof TokenFormData) => void;
  validateField: (field: keyof TokenFormData) => string | undefined;
  validateStep: (step: CreateTokenStep) => boolean;

  // Creation state
  isCreating: boolean;
  creationProgress: TokenCreationProgress;
  costBreakdown: ReturnType<typeof getCostBreakdown>;

  // Actions
  createToken: () => Promise<void>;
  resetForm: () => void;

  // Wallet state
  isWalletConnected: boolean;
  walletAddress: string | null;

  // Terms
  termsAccepted: boolean;
  setTermsAccepted: (accepted: boolean) => void;
}

const initialFormData: TokenFormData = {
  name: '',
  symbol: '',
  description: '',
  image: null,
  imagePreview: null,
  twitter: '',
  telegram: '',
  website: '',
};

const initialProgress: TokenCreationProgress = {
  stage: 'idle',
  message: '',
  progress: 0,
};

export function useCreateToken(): UseCreateTokenReturn {
  const router = useRouter();
  const { publicKey, signTransaction, connected } = useWallet();

  // Form state
  const [formData, setFormData] = useState<TokenFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Step state
  const [currentStep, setCurrentStep] = useState<CreateTokenStep>('details');

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState<TokenCreationProgress>(initialProgress);

  // Terms state
  const [termsAccepted, setTermsAccepted] = useState(false);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const costBreakdown = useMemo(() => getCostBreakdown(), []);

  // Update a single form field
  const updateField = useCallback(<K extends keyof TokenFormData>(
    field: K,
    value: TokenFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Set image with preview
  const setImage = useCallback((file: File | null, preview: string | null) => {
    setFormData((prev) => ({
      ...prev,
      image: file,
      imagePreview: preview,
    }));

    if (errors.image) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    }
  }, [errors]);

  // Mark field as touched
  const touchField = useCallback((field: keyof TokenFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Validate a single field
  const validateField = useCallback((field: keyof TokenFormData): string | undefined => {
    let result;

    switch (field) {
      case 'name':
        result = validateTokenName(formData.name);
        break;
      case 'symbol':
        result = validateTokenSymbol(formData.symbol);
        break;
      case 'description':
        result = validateDescription(formData.description);
        break;
      case 'image':
        result = validateImage(formData.image);
        break;
      case 'twitter':
        result = validateTwitter(formData.twitter || '');
        break;
      case 'telegram':
        result = validateTelegram(formData.telegram || '');
        break;
      case 'website':
        result = validateUrl(formData.website || '', 'website');
        break;
      default:
        return undefined;
    }

    if (!result.isValid) {
      setErrors((prev) => ({ ...prev, [field]: result.error! }));
      return result.error;
    }

    return undefined;
  }, [formData]);

  // Validate a specific step
  const validateStep = useCallback((step: CreateTokenStep): boolean => {
    switch (step) {
      case 'details': {
        const nameResult = validateTokenName(formData.name);
        const symbolResult = validateTokenSymbol(formData.symbol);
        const descResult = validateDescription(formData.description);

        const newErrors: Record<string, string> = {};
        if (!nameResult.isValid) newErrors.name = nameResult.error!;
        if (!symbolResult.isValid) newErrors.symbol = symbolResult.error!;
        if (!descResult.isValid) newErrors.description = descResult.error!;

        // Validate optional social fields if provided
        if (formData.twitter) {
          const twitterResult = validateTwitter(formData.twitter);
          if (!twitterResult.isValid) newErrors.twitter = twitterResult.error!;
        }
        if (formData.telegram) {
          const telegramResult = validateTelegram(formData.telegram);
          if (!telegramResult.isValid) newErrors.telegram = telegramResult.error!;
        }
        if (formData.website) {
          const websiteResult = validateUrl(formData.website, 'website');
          if (!websiteResult.isValid) newErrors.website = websiteResult.error!;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      }

      case 'image': {
        const imageResult = validateImage(formData.image);
        if (!imageResult.isValid) {
          setErrors((prev) => ({ ...prev, image: imageResult.error! }));
          return false;
        }
        return true;
      }

      case 'preview':
        return true; // Preview step has no validation

      case 'launch':
        return termsAccepted && connected;

      default:
        return false;
    }
  }, [formData, termsAccepted, connected]);

  // Navigation
  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 'details':
        return formData.name.length > 0 && formData.symbol.length > 0 && formData.description.length > 0;
      case 'image':
        return formData.image !== null;
      case 'preview':
        return true;
      case 'launch':
        return false; // Last step
      default:
        return false;
    }
  }, [currentStep, formData]);

  const canGoPrev = currentStepIndex > 0;

  const goToNextStep = useCallback(() => {
    if (!validateStep(currentStep)) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    }
  }, [currentStep, currentStepIndex, validateStep]);

  const goToPrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((step: CreateTokenStep) => {
    const targetIndex = STEPS.indexOf(step);

    // Can only go to previous steps or current step
    if (targetIndex <= currentStepIndex) {
      setCurrentStep(step);
    }
  }, [currentStepIndex]);

  // Create token
  const createToken = useCallback(async () => {
    // Final validation
    const validation = validateTokenForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix the form errors');
      return;
    }

    if (!connected || !publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setIsCreating(true);

    try {
      const result = await tokenCreationService.createToken(
        {
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          image: formData.image!,
          twitter: formData.twitter,
          telegram: formData.telegram,
          website: formData.website,
        },
        {
          publicKey,
          signTransaction,
        },
        setCreationProgress
      );

      if (result.success && result.mintAddress) {
        toast.success('Token created successfully!');

        // Redirect to token page after a short delay
        setTimeout(() => {
          router.push(`/token/${result.mintAddress}`);
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to create token');
        setCreationProgress({
          stage: 'error',
          message: result.error || 'Failed to create token',
          progress: 0,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(message);
      setCreationProgress({
        stage: 'error',
        message,
        progress: 0,
      });
    } finally {
      setIsCreating(false);
    }
  }, [formData, connected, publicKey, signTransaction, termsAccepted, router]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    setTouched({});
    setCurrentStep('details');
    setIsCreating(false);
    setCreationProgress(initialProgress);
    setTermsAccepted(false);
  }, []);

  return {
    // Form state
    formData,
    errors,
    touched,

    // Step management
    currentStep,
    currentStepIndex,
    canGoNext,
    canGoPrev,
    goToNextStep,
    goToPrevStep,
    goToStep,

    // Form updates
    updateField,
    setImage,
    touchField,
    validateField,
    validateStep,

    // Creation state
    isCreating,
    creationProgress,
    costBreakdown,

    // Actions
    createToken,
    resetForm,

    // Wallet state
    isWalletConnected: connected,
    walletAddress: publicKey?.toBase58() || null,

    // Terms
    termsAccepted,
    setTermsAccepted,
  };
}

export default useCreateToken;
