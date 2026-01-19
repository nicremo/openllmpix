// Custom hook for image upload with HEIC/TIFF conversion, drag-and-drop, and paste support
// Simplified version without Supabase Storage - returns base64 only

import { useState, useCallback, useRef, DragEvent } from 'react';
import {
  processImageFile,
  extractImagesFromDataTransfer,
  resizeImage,
  MAX_CONTEXT_IMAGES,
  ImageProcessingStatus
} from '@/lib/image-utils';

interface UseImageUploadOptions {
  maxImages?: number;
  onImagesAdded?: (images: string[]) => void;
  onError?: (error: string) => void;
  maxImageSize?: number; // Max dimension in pixels (default: 2048)
}

interface UseImageUploadReturn {
  // Status
  isProcessing: boolean;
  processingStatus: ImageProcessingStatus;
  isDragging: boolean;
  error: string | null;

  // Handlers
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragEnter: (e: DragEvent) => void;
  handleDragLeave: (e: DragEvent) => void;
  handleDragOver: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => void;
  handlePaste: (e: React.ClipboardEvent | ClipboardEvent) => void;
  processFiles: (files: File[]) => Promise<string[]>;

  // Refs
  fileInputRef: React.RefObject<HTMLInputElement | null>;

  // Actions
  openFilePicker: () => void;
  clearError: () => void;
}

export function useImageUpload(
  currentImages: string[],
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const {
    maxImages = MAX_CONTEXT_IMAGES,
    onImagesAdded,
    onError,
    maxImageSize = 2048,
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ImageProcessingStatus>({ status: 'idle' });
  const [dragCounter, setDragCounter] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Derive isDragging from counter - fixes nested element drag issues
  const isDragging = dragCounter > 0;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Process multiple files
  const processFiles = useCallback(async (files: File[]): Promise<string[]> => {
    const availableSlots = maxImages - currentImages.length;
    if (availableSlots <= 0) {
      const errorMsg = `Maximum ${maxImages} images allowed`;
      setError(errorMsg);
      onError?.(errorMsg);
      return [];
    }

    const filesToProcess = files.slice(0, availableSlots);
    const results: string[] = [];

    setIsProcessing(true);
    setError(null);

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        try {
          // Process file (HEIC conversion, etc.)
          let base64 = await processImageFile(file, (status) => {
            setProcessingStatus(status);
          });

          // Resize if needed
          if (maxImageSize > 0) {
            setProcessingStatus({ status: 'processing', progress: 85 });
            base64 = await resizeImage(base64, maxImageSize);
          }

          // Return base64 directly
          results.push(base64);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Error processing image';
          setError(errorMsg);
          onError?.(errorMsg);
          // Continue with next file instead of stopping completely
        }
      }

      if (results.length > 0) {
        onImagesAdded?.(results);
      }
    } finally {
      // ALWAYS reset processing state, even on errors
      setIsProcessing(false);
      setProcessingStatus({ status: 'idle' });
    }

    return results;
  }, [currentImages.length, maxImages, onImagesAdded, onError, maxImageSize]);

  // File Input Handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
    // Reset input for re-selecting same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  // Drag Handlers - Using counter pattern to fix nested element issues
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0); // Reset counter on drop

    if (e.dataTransfer) {
      const files = extractImagesFromDataTransfer(e.dataTransfer);
      if (files.length > 0) {
        processFiles(files);
      }
    }
  }, [processFiles]);

  // Paste Handler
  const handlePaste = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
    const clipboardData = 'clipboardData' in e ? e.clipboardData : null;
    if (!clipboardData) return;

    const files = extractImagesFromDataTransfer(clipboardData as DataTransfer);
    if (files.length > 0) {
      e.preventDefault();
      processFiles(files);
    }
  }, [processFiles]);

  // Utility Actions
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    processingStatus,
    isDragging,
    error,
    handleFileInput,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handlePaste,
    processFiles,
    fileInputRef,
    openFilePicker,
    clearError,
  };
}
