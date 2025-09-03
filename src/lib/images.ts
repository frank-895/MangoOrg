// Client-side image utilities (for preview and validation)
export interface ImageUploadResult {
  url: string
  fileName: string
  size: number
  type: string
}

export interface ImageDeleteResult {
  success: boolean
  error?: string
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum size is 5MB.' }
  }

  return { valid: true }
}

/**
 * Create a local preview URL for immediate display
 */
export function createLocalPreview(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Clean up local preview URL to prevent memory leaks
 */
export function cleanupLocalPreview(url: string): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/**
 * Extract filename from Supabase storage URL
 */
export function extractFileNameFromUrl(url: string): string | null {
  try {
    // Handle Supabase storage URLs
    // Format: https://[project].supabase.co/storage/v1/object/public/disease-images/[filename]
    const match = url.match(/\/disease-images\/(.+)$/)
    if (match) {
      return decodeURIComponent(match[1])
    }

    // Handle other URL formats
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    return pathParts[pathParts.length - 1] || null
  } catch (error) {
    console.error('Error extracting filename from URL:', error)
    return null
  }
}
