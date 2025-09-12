'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Location {
  id: string
  locationName: string
  hemisphere: 'NORTH' | 'SOUTH'
  locationSusceptability: number
  createdAt: string
  updatedAt: string
}

interface Variety {
  id: string
  varietyName: string
  varietySusceptability: number
  createdAt: string
  updatedAt: string
}

interface LocationDialogData {
  id?: string
  locationName: string
  hemisphere: 'NORTH' | 'SOUTH'
  locationSusceptability: number
  isEditing: boolean
}

interface VarietyDialogData {
  id?: string
  varietyName: string
  varietySusceptability: number
  isEditing: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [varieties, setVarieties] = useState<Variety[]>([])
  const [activeTab, setActiveTab] = useState<'locations' | 'varieties'>('locations')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingLocationIds, setDeletingLocationIds] = useState<Set<string>>(new Set())
  const [deletingVarietyIds, setDeletingVarietyIds] = useState<Set<string>>(new Set())
  
  // Dialog states
  const [locationDialog, setLocationDialog] = useState<{ open: boolean; data: LocationDialogData | null }>({
    open: false,
    data: null
  })
  const [varietyDialog, setVarietyDialog] = useState<{ open: boolean; data: VarietyDialogData | null }>({
    open: false,
    data: null
  })

  useEffect(() => {
    checkAdminStatusAndLoadData()
  }, [user])

  const checkAdminStatusAndLoadData = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        router.push('/login')
        return
      }

      // Check admin status
      const response = await fetch('/api/auth/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        setIsUserAdmin(false)
        setLoading(false)
        return
      }

      const data = await response.json()
      setIsUserAdmin(data.isAdmin)

      if (data.isAdmin) {
        await loadLocations()
        await loadVarieties()
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsUserAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const loadLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations)
      }
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  const loadVarieties = async () => {
    try {
      const response = await fetch('/api/varieties')
      if (response.ok) {
        const data = await response.json()
        setVarieties(data.varieties)
      }
    } catch (error) {
      console.error('Error loading varieties:', error)
    }
  }

  const openLocationDialog = (location?: Location) => {
    setLocationDialog({
      open: true,
      data: location ? {
        id: location.id,
        locationName: location.locationName,
        hemisphere: location.hemisphere,
        locationSusceptability: location.locationSusceptability,
        isEditing: true
      } : {
        locationName: '',
        hemisphere: 'SOUTH',
        locationSusceptability: 0,
        isEditing: false
      }
    })
  }

  const openVarietyDialog = (variety?: Variety) => {
    setVarietyDialog({
      open: true,
      data: variety ? {
        id: variety.id,
        varietyName: variety.varietyName,
        varietySusceptability: variety.varietySusceptability,
        isEditing: true
      } : {
        varietyName: '',
        varietySusceptability: 0,
        isEditing: false
      }
    })
  }

  const closeDialogs = () => {
    setLocationDialog({ open: false, data: null })
    setVarietyDialog({ open: false, data: null })
    setError(null)
  }

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationDialog.data) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const url = locationDialog.data.isEditing 
        ? `/api/locations/${locationDialog.data.id}`
        : '/api/locations'
      
      const method = locationDialog.data.isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          locationName: locationDialog.data.locationName,
          hemisphere: locationDialog.data.hemisphere,
          locationSusceptability: locationDialog.data.locationSusceptability
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save location')
      }

      setSuccess(`Location ${locationDialog.data.isEditing ? 'updated' : 'created'} successfully`)
      closeDialogs()
      await loadLocations()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save location')
    } finally {
      setSaving(false)
    }
  }

  const handleVarietySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!varietyDialog.data) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const url = varietyDialog.data.isEditing 
        ? `/api/varieties/${varietyDialog.data.id}`
        : '/api/varieties'
      
      const method = varietyDialog.data.isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          varietyName: varietyDialog.data.varietyName,
          varietySusceptability: varietyDialog.data.varietySusceptability
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save variety')
      }

      setSuccess(`Variety ${varietyDialog.data.isEditing ? 'updated' : 'created'} successfully`)
      closeDialogs()
      await loadVarieties()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save variety')
    } finally {
      setSaving(false)
    }
  }

  const handleLocationDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return

    setDeletingLocationIds(prev => new Set(prev).add(id))
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token || ''}` }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete location')
      }

      setSuccess('Location deleted successfully')
      await loadLocations()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete location')
    } finally {
      setDeletingLocationIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleVarietyDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variety?')) return

    setDeletingVarietyIds(prev => new Set(prev).add(id))
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`/api/varieties/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token || ''}` }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete variety')
      }

      setSuccess('Variety deleted successfully')
      await loadVarieties()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete variety')
    } finally {
      setDeletingVarietyIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  if (loading) {
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

  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Access denied. Admin privileges required.
          </div>
          <Link
            href="/dashboard"
            className="inline-block mt-4 text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage locations and varieties available to users
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('locations')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'locations'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Locations ({locations.length})
              </button>
              <button
                onClick={() => setActiveTab('varieties')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'varieties'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Varieties ({varieties.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'locations' && (
              <div className="space-y-6">
                {/* Add Location Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Locations</h3>
                  <button
                    onClick={() => openLocationDialog()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Add Location
                  </button>
                </div>

                {/* Locations List */}
                <div className="grid grid-cols-1 gap-4">
                  {locations.map((location) => {
                    const isDeleting = deletingLocationIds.has(location.id)
                    return (
                      <div key={location.id} className={`border border-gray-200 rounded-lg p-4 flex justify-between items-center relative ${isDeleting ? 'opacity-60' : ''}`}>
                        {isDeleting && (
                          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-1"></div>
                              <p className="text-xs text-gray-600">Deleting...</p>
                            </div>
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">{location.locationName}</h4>
                          <p className="text-sm text-gray-600">
                            {location.hemisphere === 'NORTH' ? 'Northern' : 'Southern'} Hemisphere • 
                            Susceptibility: {location.locationSusceptability}/10
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openLocationDialog(location)}
                            disabled={isDeleting}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleLocationDelete(location.id)}
                            disabled={isDeleting}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {locations.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No locations found. Add your first location.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'varieties' && (
              <div className="space-y-6">
                {/* Add Variety Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Varieties</h3>
                  <button
                    onClick={() => openVarietyDialog()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Add Variety
                  </button>
                </div>

                {/* Varieties List */}
                <div className="grid grid-cols-1 gap-4">
                  {varieties.map((variety) => (
                    <div key={variety.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center relative">
                      {/* Loading overlay */}
                      {deletingVarietyIds.has(variety.id) && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center z-10">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                            <span className="text-sm text-gray-600">Deleting...</span>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-semibold text-gray-900">{variety.varietyName}</h4>
                        <p className="text-sm text-gray-600">
                          Susceptibility: {variety.varietySusceptability}/10
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openVarietyDialog(variety)}
                          disabled={deletingVarietyIds.has(variety.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleVarietyDelete(variety.id)}
                          disabled={deletingVarietyIds.has(variety.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {varieties.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No varieties found. Add your first variety.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Dialog */}
        {locationDialog.open && locationDialog.data && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {locationDialog.data.isEditing ? 'Edit Location' : 'Add New Location'}
                </h3>
                
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLocationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      value={locationDialog.data.locationName}
                      onChange={(e) => setLocationDialog(prev => prev.data ? {
                        ...prev,
                        data: { ...prev.data, locationName: e.target.value }
                      } : prev)}
                      required
                      disabled={saving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                      placeholder="e.g., North Queensland"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hemisphere
                    </label>
                    <select
                      value={locationDialog.data.hemisphere}
                      onChange={(e) => setLocationDialog(prev => prev.data ? {
                        ...prev,
                        data: { ...prev.data, hemisphere: e.target.value as 'NORTH' | 'SOUTH' }
                      } : prev)}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    >
                      <option value="NORTH">Northern</option>
                      <option value="SOUTH">Southern</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Susceptibility (0-10) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={locationDialog.data.locationSusceptability}
                      onChange={(e) => setLocationDialog(prev => prev.data ? {
                        ...prev,
                        data: { ...prev.data, locationSusceptability: parseInt(e.target.value) }
                      } : prev)}
                      required
                      disabled={saving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={closeDialogs}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : locationDialog.data.isEditing ? 'Update Location' : 'Add Location'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Variety Dialog */}
        {varietyDialog.open && varietyDialog.data && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {varietyDialog.data.isEditing ? 'Edit Variety' : 'Add New Variety'}
                </h3>
                
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVarietySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variety Name *
                    </label>
                    <input
                      type="text"
                      value={varietyDialog.data.varietyName}
                      onChange={(e) => setVarietyDialog(prev => prev.data ? {
                        ...prev,
                        data: { ...prev.data, varietyName: e.target.value }
                      } : prev)}
                      required
                      disabled={saving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                      placeholder="e.g., Kensington Pride"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Susceptibility (0-10) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={varietyDialog.data.varietySusceptability}
                      onChange={(e) => setVarietyDialog(prev => prev.data ? {
                        ...prev,
                        data: { ...prev.data, varietySusceptability: parseInt(e.target.value) }
                      } : prev)}
                      required
                      disabled={saving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={closeDialogs}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : varietyDialog.data.isEditing ? 'Update Variety' : 'Add Variety'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}