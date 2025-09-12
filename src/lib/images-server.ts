import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
 * Upload image to Supabase storage (server-side only)
 */
export async function uploadImage(file: File, fileName?: string): Promise<ImageUploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const finalFileName = fileName || `diseases/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('disease-images')
      .upload(finalFileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('disease-images')
      .getPublicUrl(finalFileName)

    return {
      url: publicUrl,
      fileName: finalFileName,
      size: file.size,
      type: file.type
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * Delete image from Supabase storage (server-side only)
 */
export async function deleteImage(imageUrl: string): Promise<ImageDeleteResult> {
  try {
    if (!imageUrl) {
      return { success: true } // Nothing to delete
    }

    // Extract filename from URL
    const fileName = extractFileNameFromUrl(imageUrl)
    if (!fileName) {
      return { success: false, error: 'Could not extract filename from URL' }
    }

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('disease-images')
      .remove([fileName])

    if (error) {
      console.error('Error deleting image:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting image:', error)
    return { success: false, error: 'Failed to delete image' }
  }
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
