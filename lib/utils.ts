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

  // 1. If it's already a valid http/https URL
  if (path.startsWith('http')) {
    // If it points to localhost, replace it with our configured API_BASE_URL
    if (path.includes('localhost')) {
      // Remove the http://localhost:PORT part and keep the rest
      // Assuming standard format http://localhost:8000/static/...
      const relativePath = path.replace(/^https?:\/\/localhost:\d+/, '');
      return `${API_BASE_URL}${relativePath}`;
    }
    return path;
  }

  // 2. If it's a relative path, prepend API_BASE_URL
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
