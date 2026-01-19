// Image processing utilities for Chat Studio
// Supports: JPG, PNG, GIF, WebP, BMP, HEIC/HEIF, TIFF
// Note: heic2any is dynamically imported to avoid SSR issues

// Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_CONTEXT_IMAGES = 4;
export const CONVERSION_TIMEOUT = 30000; // 30 seconds

// Timeout wrapper for async operations
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ]);
}

export const SUPPORTED_FORMATS = {
  native: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
  needsConversion: ['image/heic', 'image/heif', 'image/tiff'],
};

// Type for upload status
export type ImageProcessingStatus =
  | { status: 'idle' }
  | { status: 'processing'; progress?: number }
  | { status: 'success'; dataUrl: string }
  | { status: 'error'; message: string };

// HEIC/HEIF Detection (browsers often don't recognize HEIC by MIME type)
export function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  );
}

// TIFF Detection
export function isTiffFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.tiff') ||
    name.endsWith('.tif') ||
    file.type === 'image/tiff'
  );
}

// Convert HEIC to JPEG Blob (dynamic import to avoid SSR issues)
export async function convertHeicToJpeg(file: File): Promise<Blob> {
  console.log('Starting HEIC conversion for:', file.name, 'Size:', file.size, 'Type:', file.type);

  // Dynamic import - heic2any uses window which is not available during SSR
  const heic2any = (await import('heic2any')).default;
  console.log('heic2any loaded successfully');

  const conversionPromise = heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });

  const blob = await withTimeout(
    conversionPromise,
    CONVERSION_TIMEOUT,
    'HEIC conversion timed out. The file may be too large or corrupted.'
  );

  console.log('HEIC conversion successful, blob size:', (blob as Blob).size || 'array');

  // heic2any can return array or single blob
  return Array.isArray(blob) ? blob[0] : blob;
}

// Convert TIFF to JPEG via Canvas
// Note: Most browsers don't support TIFF natively, so this may fail
export async function convertTiffToJpeg(file: File): Promise<Blob> {
  const conversionPromise = new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('TIFF conversion failed'));
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('TIFF not supported by browser. Please convert to JPG/PNG first.'));
    };

    img.src = url;
  });

  return withTimeout(
    conversionPromise,
    CONVERSION_TIMEOUT,
    'TIFF conversion timed out.'
  );
}

// Blob to Base64 Data URL
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// File to Base64 Data URL
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: Check file extension for images
function isImageByExtension(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif', 'tiff', 'tif'].includes(ext || '');
}

// Main function: Process any image file to Base64
export async function processImageFile(
  file: File,
  onProgress?: (status: ImageProcessingStatus) => void
): Promise<string> {
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (max. ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  onProgress?.({ status: 'processing', progress: 10 });

  // HEIC/HEIF conversion
  if (isHeicFile(file)) {
    onProgress?.({ status: 'processing', progress: 30 });
    try {
      const jpegBlob = await convertHeicToJpeg(file);
      onProgress?.({ status: 'processing', progress: 80 });
      return blobToBase64(jpegBlob);
    } catch (error) {
      console.error('HEIC conversion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`HEIC conversion failed: ${errorMessage}`);
    }
  }

  // TIFF conversion
  if (isTiffFile(file)) {
    onProgress?.({ status: 'processing', progress: 30 });
    try {
      const jpegBlob = await convertTiffToJpeg(file);
      onProgress?.({ status: 'processing', progress: 80 });
      return blobToBase64(jpegBlob);
    } catch (error) {
      throw new Error('TIFF conversion failed. Please convert the image manually.');
    }
  }

  // Native formats - read directly
  if (file.type.startsWith('image/') || isImageByExtension(file.name)) {
    onProgress?.({ status: 'processing', progress: 50 });
    return fileToBase64(file);
  }

  throw new Error('Unsupported image format');
}

// Resize image to max dimension (preserving aspect ratio)
export async function resizeImage(
  dataUrl: string,
  maxSize: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Check if resize is needed
      if (img.width <= maxSize && img.height <= maxSize) {
        resolve(dataUrl);
        return;
      }

      // Calculate new dimensions
      let newWidth = img.width;
      let newHeight = img.height;

      if (img.width > img.height) {
        if (img.width > maxSize) {
          newHeight = Math.round((img.height * maxSize) / img.width);
          newWidth = maxSize;
        }
      } else {
        if (img.height > maxSize) {
          newWidth = Math.round((img.width * maxSize) / img.height);
          newHeight = maxSize;
        }
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Use high quality interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Determine output format from input
      const mimeMatch = dataUrl.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      // Convert to data URL with quality
      const quality = mimeType === 'image/png' ? undefined : 0.92;
      resolve(canvas.toDataURL(mimeType, quality));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for resizing'));
    };

    img.src = dataUrl;
  });
}

// Extract images from DataTransfer (for Drag/Drop and Paste)
export function extractImagesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  const files: File[] = [];

  // Iterate items (for Paste)
  if (dataTransfer.items) {
    for (const item of Array.from(dataTransfer.items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && (file.type.startsWith('image/') || isImageByExtension(file.name))) {
          files.push(file);
        }
      }
    }
  }

  // Fallback to files (for Drag/Drop)
  if (files.length === 0 && dataTransfer.files) {
    for (const file of Array.from(dataTransfer.files)) {
      if (file.type.startsWith('image/') || isImageByExtension(file.name)) {
        files.push(file);
      }
    }
  }

  return files;
}
