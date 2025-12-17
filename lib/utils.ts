import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { API_BASE_URL } from "./config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper to ensure image URLs are always valid and point to the correct backend.
 * Handles cases where the DB might contain 'localhost' or relative paths.
 */
export function getValidImageUrl(path: string | undefined | null): string {
  if (!path) return '';

  console.log('[getValidImageUrl] Input:', path);

  // 1. URLs de Supabase Storage ya son válidas
  if (path.includes('supabase.co/storage')) {
    console.log('[getValidImageUrl] Supabase Storage URL detected:', path);
    return path;
  }

  // 2. URLs de Cloudinary (compatibilidad temporal)
  if (path.includes('cloudinary.com') || path.includes('res.cloudinary.com')) {
    console.log('[getValidImageUrl] Cloudinary URL detected:', path);
    return path;
  }

  // 3. If it's already a valid http/https URL
  if (path.startsWith('http')) {
    // If it points to localhost, replace it with our configured API_BASE_URL
    if (path.includes('localhost')) {
      // Remove the http://localhost:PORT part and keep the rest
      // Assuming standard format http://localhost:8000/static/...
      const relativePath = path.replace(/^https?:\/\/localhost:\d+/, '');
      const finalUrl = `${API_BASE_URL}${relativePath}`;
      console.log('[getValidImageUrl] Localhost detected. Transformed to:', finalUrl);
      return finalUrl;
    }
    console.log('[getValidImageUrl] Already valid HTTP URL:', path);
    return path;
  }

  // 4. If it's a relative path, prepend API_BASE_URL
  const finalUrl = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  console.log('[getValidImageUrl] Relative path. Transformed to:', finalUrl);
  return finalUrl;
}
