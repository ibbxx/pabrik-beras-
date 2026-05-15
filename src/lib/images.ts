/**
 * Optimizes a Supabase Storage URL by using the 'render' endpoint for resizing and compression.
 * Note: Requires Supabase Image Transformation to be enabled in the project.
 */
export function optimizeSupabaseUrl(url: string, options: { width?: number; height?: number; quality?: number; format?: 'webp' | 'avif' | 'origin'; resize?: 'cover' | 'contain' | 'fill' } = {}) {
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) return url;

  const { width = 800, height, quality = 80, format = 'webp', resize } = options;
  
  // Convert 'object' endpoint to 'render' endpoint
  let optimizedUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (resize) params.append('resize', resize);
  params.append('quality', quality.toString());
  params.append('format', format);
  
  return `${optimizedUrl}?${params.toString()}`;
}
