const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type ValidateImageOptions = {
  maxSizeMB?: number;
  allowedTypes?: readonly string[];
};

export function validateImageFile(file: File, options: ValidateImageOptions = {}) {
  const maxSizeMB = options.maxSizeMB ?? 2;
  const allowedTypes = options.allowedTypes ?? ALLOWED_IMAGE_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return `Format gambar harus JPG, PNG, atau WEBP. File saat ini: ${file.type || "tidak dikenal"}.`;
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Ukuran gambar maksimal ${maxSizeMB}MB.`;
  }

  return null;
}

export function createImageStoragePath(folder: string, file: File) {
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "uploads";
  const extension = IMAGE_EXTENSIONS[file.type] || "jpg";
  const randomPart = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);

  return `${safeFolder}/${Date.now()}-${randomPart}.${extension}`;
}

export async function compressImageFile(file: File, options: { maxWidth?: number, maxHeight?: number, quality?: number } = {}): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8 } = options;
  
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
          type: 'image/webp',
          lastModified: Date.now()
        });
        
        resolve(compressedFile);
      }, 'image/webp', quality);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original file if loading fails
    };
    
    img.src = objectUrl;
  });
}
