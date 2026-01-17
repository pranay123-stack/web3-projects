export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface TokenFormData {
  name: string;
  symbol: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
  twitter?: string;
  telegram?: string;
  website?: string;
}

export const validateTokenName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Token name is required' };
  }
  if (name.length < 2) {
    return { isValid: false, error: 'Token name must be at least 2 characters' };
  }
  if (name.length > 32) {
    return { isValid: false, error: 'Token name must be 32 characters or less' };
  }
  if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
    return { isValid: false, error: 'Token name can only contain letters, numbers, and spaces' };
  }
  return { isValid: true };
};

export const validateTokenSymbol = (symbol: string): ValidationResult => {
  if (!symbol || symbol.trim().length === 0) {
    return { isValid: false, error: 'Token symbol is required' };
  }
  if (symbol.length < 2) {
    return { isValid: false, error: 'Token symbol must be at least 2 characters' };
  }
  if (symbol.length > 10) {
    return { isValid: false, error: 'Token symbol must be 10 characters or less' };
  }
  if (!/^[A-Z0-9]+$/.test(symbol.toUpperCase())) {
    return { isValid: false, error: 'Token symbol can only contain letters and numbers' };
  }
  return { isValid: true };
};

export const validateDescription = (description: string): ValidationResult => {
  if (!description || description.trim().length === 0) {
    return { isValid: false, error: 'Description is required' };
  }
  if (description.length < 10) {
    return { isValid: false, error: 'Description must be at least 10 characters' };
  }
  if (description.length > 500) {
    return { isValid: false, error: 'Description must be 500 characters or less' };
  }
  return { isValid: true };
};

export const validateImage = (file: File | null): ValidationResult => {
  if (!file) {
    return { isValid: false, error: 'Token image is required' };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: 'Image must be JPG, PNG, GIF, or WebP' };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image must be smaller than 5MB' };
  }

  return { isValid: true };
};

export const validateUrl = (url: string, fieldName: string): ValidationResult => {
  if (!url || url.trim().length === 0) {
    return { isValid: true }; // Optional field
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: `Invalid ${fieldName} URL` };
  }
};

export const validateTwitter = (handle: string): ValidationResult => {
  if (!handle || handle.trim().length === 0) {
    return { isValid: true }; // Optional field
  }

  // Allow full URL or just handle
  const cleanHandle = handle.replace(/^@/, '').replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, '');

  if (!/^[a-zA-Z0-9_]{1,15}$/.test(cleanHandle)) {
    return { isValid: false, error: 'Invalid Twitter handle' };
  }

  return { isValid: true };
};

export const validateTelegram = (handle: string): ValidationResult => {
  if (!handle || handle.trim().length === 0) {
    return { isValid: true }; // Optional field
  }

  // Allow full URL or just handle
  const cleanHandle = handle.replace(/^@/, '').replace(/^https?:\/\/(www\.)?t\.me\//, '');

  if (!/^[a-zA-Z0-9_]{5,32}$/.test(cleanHandle)) {
    return { isValid: false, error: 'Invalid Telegram handle' };
  }

  return { isValid: true };
};

export const validateTokenForm = (data: TokenFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const nameValidation = validateTokenName(data.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error!;
  }

  const symbolValidation = validateTokenSymbol(data.symbol);
  if (!symbolValidation.isValid) {
    errors.symbol = symbolValidation.error!;
  }

  const descriptionValidation = validateDescription(data.description);
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.error!;
  }

  const imageValidation = validateImage(data.image);
  if (!imageValidation.isValid) {
    errors.image = imageValidation.error!;
  }

  if (data.twitter) {
    const twitterValidation = validateTwitter(data.twitter);
    if (!twitterValidation.isValid) {
      errors.twitter = twitterValidation.error!;
    }
  }

  if (data.telegram) {
    const telegramValidation = validateTelegram(data.telegram);
    if (!telegramValidation.isValid) {
      errors.telegram = telegramValidation.error!;
    }
  }

  if (data.website) {
    const websiteValidation = validateUrl(data.website, 'website');
    if (!websiteValidation.isValid) {
      errors.website = websiteValidation.error!;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const CREATION_FEE_SOL = 0.02; // Token creation fee
export const RENT_FEE_SOL = 0.00203928; // Approximate rent for token account
export const METADATA_RENT_SOL = 0.01; // Approximate rent for metadata

export const getCostBreakdown = () => ({
  creationFee: CREATION_FEE_SOL,
  rentFee: RENT_FEE_SOL,
  metadataRent: METADATA_RENT_SOL,
  total: CREATION_FEE_SOL + RENT_FEE_SOL + METADATA_RENT_SOL,
});
