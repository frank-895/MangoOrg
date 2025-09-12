'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Case = {
  id: string
  diseaseId: string | null
  orchardId: string | null
  status: string | null
  partOfPlant: string | null
  createdAt: string
  updatedAt: string
  disease: {
    id: string
    name: string
    type: string
  } | null
  orchard: {
    id: string
    orchardName: string
    location: {
      locationName: string
    }
    variety: {
      varietyName: string
    }
  } | null
  records: Array<{
    id: string
    recordedAt: string
  }>
}

type Disease = {
  id: string
  name: string
  type: string
}

type Orchard = {
  id: string
  orchardName: string
  location: {
    locationName: string
  }
  variety: {
    varietyName: string
  }
}

export default function CasesPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState<Case[]>([])
  const [diseases, setDiseases] = useState<Disease[]>([])
  const [orchards, setOrchards] = useState<Orchard[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingIds, setDeletingIds] = useState<string[]>([])
  const [resolvingIds, setResolvingIds] = useState<string[]>([])
  const [reactivatingIds, setReactivatingIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE')
  const [newCase, setNewCase] = useState({
    diseaseId: '',
    orchardId: '',
    status: 'ACTIVE' as const,
    partOfPlant: 'LEAF' as const
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get auth token for orchards API
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const [casesRes, diseasesRes, orchardsRes] = await Promise.all([
        fetch('/api/cases'),
        fetch('/api/diseases'),
        fetch('/api/orchards', { headers })
      ])

      if (casesRes.ok) {
        const casesData = await casesRes.json()
        setCases(casesData)
      }

      if (diseasesRes.ok) {
        const diseasesData = await diseasesRes.json()
        setDiseases(diseasesData)
      }

      if (orchardsRes.ok) {
        const orchardsData = await orchardsRes.json()
        setOrchards(orchardsData.orchards || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCase),
      })

      if (response.ok) {
        await fetchData()
        setShowCreateForm(false)
        setNewCase({
          diseaseId: '',
          orchardId: '',
          status: 'ACTIVE',
          partOfPlant: 'LEAF'
        })
      }
    } catch (error) {
      console.error('Error creating case:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm('Are you sure you want to delete this case?')) return

    setDeletingIds(prev => [...prev, caseId])
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error deleting case:', error)
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== caseId))
    }
  }

  const handleResolveCase = async (caseId: string) => {
    if (!confirm('Are you sure you want to mark this case as resolved?')) return

    setResolvingIds(prev => [...prev, caseId])
    try {
      // Find the case to get its current data
      const caseToResolve = cases.find(c => c.id === caseId)
      if (!caseToResolve) return

      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diseaseId: caseToResolve.diseaseId,
          orchardId: caseToResolve.orchardId,
          status: 'RESOLVED',
          partOfPlant: caseToResolve.partOfPlant
        }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error resolving case:', error)
    } finally {
      setResolvingIds(prev => prev.filter(id => id !== caseId))
    }
  }

  const handleReactivateCase = async (caseId: string) => {
    if (!confirm('Are you sure you want to reactivate this case?')) return

    setReactivatingIds(prev => [...prev, caseId])
    try {
      // Find the case to get its current data
      const caseToReactivate = cases.find(c => c.id === caseId)
      if (!caseToReactivate) return

      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diseaseId: caseToReactivate.diseaseId,
          orchardId: caseToReactivate.orchardId,
          status: 'ACTIVE',
          partOfPlant: caseToReactivate.partOfPlant
        }),
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error reactivating case:', error)
    } finally {
      setReactivatingIds(prev => prev.filter(id => id !== caseId))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading cases...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/dashboard"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Cases Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={creating || showCreateForm}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create New Case
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Create New Case</h2>
          <form onSubmit={handleCreateCase} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disease/Pest
              </label>
              <select
                value={newCase.diseaseId}
                onChange={(e) => setNewCase({ ...newCase, diseaseId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select a disease/pest</option>
                {diseases.map((disease) => (
                  <option key={disease.id} value={disease.id}>
                    {disease.name} ({disease.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orchard
              </label>
              <select
                value={newCase.orchardId}
                onChange={(e) => setNewCase({ ...newCase, orchardId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select an orchard</option>
                {orchards.map((orchard) => (
                  <option key={orchard.id} value={orchard.id}>
                    {orchard.orchardName} - {orchard.variety.varietyName} ({orchard.location.locationName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant Part Affected
              </label>
              <select
                value={newCase.partOfPlant}
                onChange={(e) => setNewCase({ ...newCase, partOfPlant: e.target.value as 'LEAF' | 'STEM' | 'FRUIT' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="LEAF">Leaf</option>
                <option value="STEM">Stem</option>
                <option value="FRUIT">Fruit</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={creating}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {creating ? 'Creating...' : 'Create Case'}
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ACTIVE'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Cases ({cases.filter(c => c.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'RESOLVED'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Resolved Cases ({cases.filter(c => c.status === 'RESOLVED').length})
          </button>
        </nav>
      </div>

      <div className="grid gap-6">
        {cases.filter(case_ => case_.status === activeTab).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No {activeTab.toLowerCase()} cases found.
            </p>
            {activeTab === 'ACTIVE' ? (
              <p className="text-gray-400">Create your first case to get started.</p>
            ) : (
              <p className="text-gray-400">Resolved cases will appear here when cases are marked as resolved.</p>
            )}
          </div>
        ) : (
          cases.filter(case_ => case_.status === activeTab).map((case_) => (
            <div key={case_.id} className="bg-white rounded-lg shadow-md p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {case_.disease?.name || 'Unknown Disease'}
                  </h3>
                  <p className="text-gray-600">
                    {case_.orchard?.orchardName || 'Unknown Orchard'} - {case_.orchard?.variety.varietyName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {case_.orchard?.location.locationName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    case_.status === 'ACTIVE' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {case_.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Plant Part</p>
                  <p className="font-medium">{case_.partOfPlant || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Records</p>
                  <p className="font-medium">{case_.records.length} records</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{new Date(case_.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Link
                  href={`/cases/${case_.id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  View Details
                </Link>
                {case_.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleResolveCase(case_.id)}
                    disabled={resolvingIds.includes(case_.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {resolvingIds.includes(case_.id) && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {resolvingIds.includes(case_.id) ? 'Resolving...' : 'Mark as Resolved'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivateCase(case_.id)}
                    disabled={reactivatingIds.includes(case_.id)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {reactivatingIds.includes(case_.id) && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {reactivatingIds.includes(case_.id) ? 'Reactivating...' : 'Reactivate'}
                  </button>
                )}
                <button
                  onClick={() => handleDeleteCase(case_.id)}
                  disabled={deletingIds.includes(case_.id) || resolvingIds.includes(case_.id) || reactivatingIds.includes(case_.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletingIds.includes(case_.id) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {deletingIds.includes(case_.id) ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}