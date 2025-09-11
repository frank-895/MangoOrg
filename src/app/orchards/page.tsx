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
}

interface Variety {
  id: string
  varietyName: string
  varietySusceptability: number
}

interface Orchard {
  id: string
  orchardName: string
  noTreesRow: number
  noTreesColumn: number
  area: number
  userId: string
  varietyId: string
  locationId: string
  createdAt: string
  updatedAt: string
  variety: Variety
  location: Location
}

interface OrchardDialogData {
  id?: string
  orchardName: string
  noTreesRow: number
  noTreesColumn: number
  area: number
  varietyId: string
  locationId: string
  isEditing: boolean
}

export default function OrchardsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [orchards, setOrchards] = useState<Orchard[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [varieties, setVarieties] = useState<Variety[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Dialog state
  const [orchardDialog, setOrchardDialog] = useState<{ open: boolean; data: OrchardDialogData | null }>({
    open: false,
    data: null
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadData()
  }, [user, router])

  const loadData = async () => {
    try {
      await Promise.all([
        loadOrchards(),
        loadLocations(), 
        loadVarieties()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadOrchards = async () => {
    if (!user) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/orchards', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setOrchards(data.orchards)
      } else {
        throw new Error('Failed to load orchards')
      }
    } catch (error) {
      console.error('Error loading orchards:', error)
      setError('Failed to load orchards')
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

  const openOrchardDialog = (orchard?: Orchard) => {
    setOrchardDialog({
      open: true,
      data: orchard ? {
        id: orchard.id,
        orchardName: orchard.orchardName,
        noTreesRow: orchard.noTreesRow,
        noTreesColumn: orchard.noTreesColumn,
        area: orchard.area,
        varietyId: orchard.varietyId,
        locationId: orchard.locationId,
        isEditing: true
      } : {
        orchardName: '',
        noTreesRow: 1,
        noTreesColumn: 1,
        area: 0,
        varietyId: varieties.length > 0 ? varieties[0].id : '',
        locationId: locations.length > 0 ? locations[0].id : '',
        isEditing: false
      }
    })
  }

  const closeDialog = () => {
    setOrchardDialog({ open: false, data: null })
    setError(null)
  }

  const handleOrchardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orchardDialog.data || !user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const url = orchardDialog.data.isEditing 
        ? `/api/orchards/${orchardDialog.data.id}`
        : '/api/orchards'
      
      const method = orchardDialog.data.isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          orchardName: orchardDialog.data.orchardName,
          noTreesRow: orchardDialog.data.noTreesRow,
          noTreesColumn: orchardDialog.data.noTreesColumn,
          area: orchardDialog.data.area,
          varietyId: orchardDialog.data.varietyId,
          locationId: orchardDialog.data.locationId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save orchard')
      }

      setSuccess(`Orchard ${orchardDialog.data.isEditing ? 'updated' : 'created'} successfully`)
      closeDialog()
      await loadOrchards()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save orchard')
    } finally {
      setSaving(false)
    }
  }

  const handleOrchardDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`/api/orchards/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token || ''}` }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete orchard')
      }

      setSuccess('Orchard deleted successfully')
      await loadOrchards()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete orchard')
    }
  }

  const calculateTotalTrees = (orchard: Orchard) => {
    return orchard.noTreesRow * orchard.noTreesColumn
  }

  const formatArea = (area: number) => {
    return area.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Orchards
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your mango orchards
              </p>
            </div>
            <button
              onClick={() => openOrchardDialog()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              disabled={locations.length === 0 || varieties.length === 0}
            >
              Add Orchard
            </button>
          </div>
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

        {/* Warning if no locations or varieties */}
        {(locations.length === 0 || varieties.length === 0) && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            {locations.length === 0 && varieties.length === 0 
              ? 'No locations or varieties available. Please contact an administrator to set up locations and varieties before creating orchards.'
              : locations.length === 0 
                ? 'No locations available. Please contact an administrator to set up locations before creating orchards.'
                : 'No varieties available. Please contact an administrator to set up varieties before creating orchards.'
            }
          </div>
        )}

        {/* Orchards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orchards.map((orchard) => (
            <div key={orchard.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{orchard.orchardName}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openOrchardDialog(orchard)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Edit orchard"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleOrchardDelete(orchard.id, orchard.orchardName)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Delete orchard"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Variety:</span>
                    <span className="font-medium">{orchard.variety.varietyName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{orchard.location.locationName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Area:</span>
                    <span className="font-medium">{formatArea(orchard.area)} acres</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Grid:</span>
                    <span className="font-medium">{orchard.noTreesRow} × {orchard.noTreesColumn}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Trees:</span>
                    <span className="font-medium text-green-600">{calculateTotalTrees(orchard).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Variety Risk: {orchard.variety.varietySusceptability}/10</span>
                    <span>Location Risk: {orchard.location.locationSusceptability}/10</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {orchards.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <div className="mx-auto w-16 h-16 mb-4 text-gray-300">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orchards yet</h3>
              <p className="text-gray-500 mb-4">Create your first orchard to get started with managing your mango trees.</p>
              {locations.length > 0 && varieties.length > 0 && (
                <button
                  onClick={() => openOrchardDialog()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Your First Orchard
                </button>
              )}
            </div>
          )}
        </div>

        {/* Orchard Dialog */}
        {orchardDialog.open && orchardDialog.data && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {orchardDialog.data.isEditing ? 'Edit Orchard' : 'Add New Orchard'}
                </h3>
                
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleOrchardSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orchard Name *
                    </label>
                    <input
                      type="text"
                      value={orchardDialog.data.orchardName}
                      onChange={(e) => setOrchardDialog(prev => prev.data ? {
                        ...prev,
                        data: { ...prev.data, orchardName: e.target.value }
                      } : prev)}
                      required
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                      placeholder="e.g., North Paddock"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variety *
                      </label>
                      <select
                        value={orchardDialog.data.varietyId}
                        onChange={(e) => setOrchardDialog(prev => prev.data ? {
                          ...prev,
                          data: { ...prev.data, varietyId: e.target.value }
                        } : prev)}
                        required
                        disabled={saving}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                      >
                        {varieties.map(variety => (
                          <option key={variety.id} value={variety.id}>
                            {variety.varietyName}
                          </option>
                        ))}
                      </select>
                      {varieties.find(v => v.id === orchardDialog.data?.varietyId) && (
                        <p className="text-xs text-gray-500 mt-1">
                          Susceptibility: {varieties.find(v => v.id === orchardDialog.data?.varietyId)?.varietySusceptability}/10
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <select
                        value={orchardDialog.data.locationId}
                        onChange={(e) => setOrchardDialog(prev => prev.data ? {
                          ...prev,
                          data: { ...prev.data, locationId: e.target.value }
                        } : prev)}
                        required
                        disabled={saving}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                      >
                        {locations.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.locationName}
                          </option>
                        ))}
                      </select>
                      {locations.find(l => l.id === orchardDialog.data?.locationId) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {locations.find(l => l.id === orchardDialog.data?.locationId)?.hemisphere === 'NORTH' ? 'Northern' : 'Southern'} Hemisphere • 
                          Susceptibility: {locations.find(l => l.id === orchardDialog.data?.locationId)?.locationSusceptability}/10
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Area (acres) *
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={orchardDialog.data.area}
                        onChange={(e) => setOrchardDialog(prev => prev.data ? {
                          ...prev,
                          data: { ...prev.data, area: parseFloat(e.target.value) || 0 }
                        } : prev)}
                        required
                        disabled={saving}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        placeholder="e.g., 5.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trees per Row *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={orchardDialog.data.noTreesRow}
                        onChange={(e) => setOrchardDialog(prev => prev.data ? {
                          ...prev,
                          data: { ...prev.data, noTreesRow: parseInt(e.target.value) || 1 }
                        } : prev)}
                        required
                        disabled={saving}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        placeholder="e.g., 20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Rows *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={orchardDialog.data.noTreesColumn}
                        onChange={(e) => setOrchardDialog(prev => prev.data ? {
                          ...prev,
                          data: { ...prev.data, noTreesColumn: parseInt(e.target.value) || 1 }
                        } : prev)}
                        required
                        disabled={saving}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        placeholder="e.g., 15"
                      />
                    </div>
                  </div>

                  {orchardDialog.data.noTreesRow > 0 && orchardDialog.data.noTreesColumn > 0 && (
                    <div className="bg-green-50 p-3 rounded-md">
                      <p className="text-sm text-green-700">
                        Total trees: <strong>{(orchardDialog.data.noTreesRow * orchardDialog.data.noTreesColumn).toLocaleString()}</strong>
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeDialog}
                      disabled={saving}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {saving ? 'Saving...' : orchardDialog.data.isEditing ? 'Update Orchard' : 'Add Orchard'}
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