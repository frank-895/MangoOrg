'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Disease, CreateDiseaseData } from '@/types/disease'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { createLocalPreview, cleanupLocalPreview, validateImageFile } from '@/lib/images'

interface DiseaseFormProps {
  disease?: Disease | null
  isEditing?: boolean
}

export default function DiseaseForm({ disease, isEditing = false }: DiseaseFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [roleLoading, setRoleLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<CreateDiseaseData>({
    name: '',
    type: 'DISEASE',
    severity: 0,
    spreadability: 0,
    shortDescription: '',
    longDescription: '',
    controlMethod: '',
    imageLink: ''
  })

  useEffect(() => {
    checkAdminStatus()
    if (disease && isEditing) {
      setFormData({
        name: disease.name,
        type: disease.type,
        severity: disease.severity || 0,
        spreadability: disease.spreadability || 0,
        shortDescription: disease.shortDescription || '',
        longDescription: disease.longDescription || '',
        controlMethod: disease.controlMethod || '',
        imageLink: disease.imageLink || ''
      })
      if (disease.imageLink) {
        setImagePreview(disease.imageLink)
        setCurrentImageUrl(disease.imageLink)
      }
    }
  }, [disease, isEditing, user])

  // Cleanup local preview URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        cleanupLocalPreview(imagePreview)
      }
    }
  }, [imagePreview])

  const checkAdminStatus = async () => {
    if (user) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        
        if (token) {
          const response = await fetch('/api/auth/admin', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setIsUserAdmin(data.isAdmin)
          } else {
            setIsUserAdmin(false)
          }
        } else {
          setIsUserAdmin(false)
        }
      } catch (error) {
        console.error('Error checking admin status:')
        setIsUserAdmin(false)
      } finally {
        setRoleLoading(false)
      }
    } else {
      setIsUserAdmin(false)
      setRoleLoading(false)
    }
  }

  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    )
  }

  // Check if user is admin
  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Access denied. Admin privileges required.
          </div>
          <Link
            href="/diseases"
            className="inline-block mt-4 text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to Diseases
          </Link>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'severity' || name === 'spreadability' ? parseInt(value) : value
    }))
  }

  const processImageFile = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    // Show local preview immediately
    const localUrl = createLocalPreview(file)
    setImagePreview(localUrl)
    
    // Mark old image for deletion
    if (currentImageUrl) {
      setImageToDelete(currentImageUrl)
    }

    setUploadingImage(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      
      // Update form data with real URL
      setFormData(prev => ({ ...prev, imageLink: data.url }))
      setCurrentImageUrl(data.url)
      
      // Replace local preview with real URL
      setImagePreview(data.url)
      
      // Clean up local preview
      cleanupLocalPreview(localUrl)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      // Revert to previous image on error
      setImagePreview(currentImageUrl)
      setImageToDelete(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processImageFile(file)
  }

  const handleImageDelete = async () => {
    if (!imagePreview) return

    // Mark current image for deletion
    if (currentImageUrl) {
      setImageToDelete(currentImageUrl)
    }

    // Clear preview and form data
    setImagePreview(null)
    setCurrentImageUrl(null)
    setFormData(prev => ({ ...prev, imageLink: '' }))
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        await processImageFile(file)
      } else {
        setError('Please drop an image file')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const url = isEditing ? `/api/diseases/${disease?.id}` : '/api/diseases'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save disease')
      }

      // Delete old images if they were replaced
      if (imageToDelete) {
        try {
          const deleteResponse = await fetch('/api/upload/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token || ''}`
            },
            body: JSON.stringify({ imageUrl: imageToDelete })
          })

          if (deleteResponse.ok) {
            console.log('✅ Deleted old image:', imageToDelete)
          } else {
            console.error('❌ Failed to delete old image:', imageToDelete)
          }
        } catch (error) {
          console.error('❌ Error deleting old image:', error)
        }
      }

      router.push('/diseases')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save disease')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/diseases"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Diseases
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Disease/Pest' : 'Add New Disease/Pest'}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Anthracnose, Mango Fruit Fly"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="DISEASE">Disease</option>
                  <option value="PEST">Pest</option>
                </select>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity (0-10)
                </label>
                <input
                  type="number"
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = No impact, 10 = Severe damage
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spreadability (0-10)
                </label>
                <input
                  type="number"
                  name="spreadability"
                  value={formData.spreadability}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = Doesn't spread, 10 = Highly contagious
                </p>
              </div>
            </div>

            {/* Descriptions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description
              </label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Brief description for the overview page..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Long Description
              </label>
              <textarea
                name="longDescription"
                value={formData.longDescription}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Detailed description including symptoms, causes, and identification..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Control Methods
              </label>
              <textarea
                name="controlMethod"
                value={formData.controlMethod}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Prevention and treatment methods..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image
              </label>
              
              {/* Current Image Preview */}
              {imagePreview && (
                <div className="mb-4">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={handleImageDelete}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click the X to remove this image
                  </p>
                </div>
              )}

              {/* Drag and Drop Zone */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                  ${isDragOver 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <svg 
                      className={`w-12 h-12 ${isDragOver ? 'text-green-500' : 'text-gray-400'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                      />
                    </svg>
                  </div>
                  
                  <div>
                    <p className={`text-lg font-medium ${isDragOver ? 'text-green-600' : 'text-gray-700'}`}>
                      {isDragOver ? 'Drop your image here' : 'Drag & drop an image here'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse files
                    </p>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Supported formats: JPEG, PNG, WebP • Max size: 5MB
                  </div>
                </div>
              </div>
              
              {uploadingImage && (
                <div className="mt-4 text-sm text-blue-600 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Uploading image...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/diseases"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : isEditing ? 'Update Disease/Pest' : 'Create Disease/Pest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
