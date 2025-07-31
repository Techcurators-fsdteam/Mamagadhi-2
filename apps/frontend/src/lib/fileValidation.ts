// File validation utilities
export const FILE_SIZE_LIMIT = 2 * 1024 * 1024; // 2MB in bytes

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/bmp'
];

export const ALLOWED_DOCUMENT_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf'
];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (
  file: File, 
  allowedTypes: string[] = ALLOWED_DOCUMENT_TYPES
): FileValidationResult => {
  // Check file size
  if (file.size > FILE_SIZE_LIMIT) {
    return {
      isValid: false,
      error: `File size must be less than 2MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes
      .map(type => type.split('/')[1].toUpperCase())
      .join(', ');
    return {
      isValid: false,
      error: `Invalid file type. Only ${allowedExtensions} files are allowed.`
    };
  }

  return { isValid: true };
};

export const validateImageFile = (file: File): FileValidationResult => {
  return validateFile(file, ALLOWED_IMAGE_TYPES);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
