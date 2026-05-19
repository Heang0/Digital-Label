/**
 * Client-Side High-Quality Image Compression Utility
 * Compresses images before upload to save massive storage and bandwidth,
 * ensuring blazing-fast uploads and lightning-quick dashboard render speeds.
 */
export const compressImage = (
  file: File, 
  maxW = 1000, 
  maxH = 1000, 
  quality = 0.75
): Promise<File> => {
  return new Promise((resolve) => {
    // If the file is not a supported image type, bypass compression
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain original aspect ratio and scale down if exceeding boundaries
        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        // Apply high-quality image smoothing techniques
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        // Export as optimized JPEG (highly compressed, extremely premium visual quality)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            
            // Generate optimized file name with .jpg extension
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + "_optimized.jpg";
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};
