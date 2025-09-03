'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Disease } from '@/types/disease'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DiseasesPage() {
  const [diseases, setDiseases] = useState<Disease[]>([])
  const [loading, setLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'DISEASE' | 'PEST'>('ALL')
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchDiseases()
    checkAdminStatus()
  }, [user])

  const fetchDiseases = async () => {
    try {
      const response = await fetch('/api/diseases')
      if (!response.ok) {
        throw new Error('Failed to fetch diseases')
      }
      const data = await response.json()
      setDiseases(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

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
        console.error('Error checking admin status')
        setIsUserAdmin(false)
      } finally {
        setRoleLoading(false)
      }
    } else {
      setIsUserAdmin(false)
      setRoleLoading(false)
    }
  }

  const filteredDiseases = diseases.filter(disease => {
    if (filterType === 'ALL') return true
    return disease.type === filterType
  })

  const getSeverityColor = (severity: number | null | undefined) => {
    if (!severity || severity <= 3) return 'text-green-600 bg-green-100'
    if (severity <= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getSpreadabilityColor = (spreadability: number | null | undefined) => {
    if (!spreadability || spreadability <= 3) return 'text-green-600 bg-green-100'
    if (spreadability <= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getPlaceholderImage = (disease: Disease) => {
    if (disease.imageLink) {
      return disease.imageLink
    }
    
    // Return different placeholder based on disease type
    if (disease.type === 'DISEASE') {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDMyMCAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTkyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgOTZDMTQzLjQzMSA5NiAxMzAgMTA5LjQzMSAxMzAgMTI2QzEzMCAxNDIuNTY5IDE0My40MzEgMTU2IDE2MCAxNTZDMTc2LjU2OSAxNTYgMTkwIDE0Mi41NjkgMTkwIDEyNkMxOTAgMTA5LjQzMSAxNzYuNTY5IDk2IDE2MCA5NloiIGZpbGw9IiNEN0Q5RDAiLz4KPHBhdGggZD0iTTE2MCAxMzZDMTA5LjQzMSAxMzYgNjYgMTc5LjQzMSA2NiAyMzBDNjYgMjgwLjU2OSAxMDkuNDMxIDMyNCAxNjAgMzI0QzIxMC41NjkgMzI0IDI1NCAyODAuNTY5IDI1NCAyMzBDMjU0IDE3OS40MzEgMjEwLjU2OSAxMzYgMTYwIDEzNloiIGZpbGw9IiNEN0Q5RDAiLz4KPHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDQvMTAvMjAwNC1zdmciPgo8cGF0aCBkPSJNMjQgNEMxMi45NTQzIDQgNCAxMi45NTQzIDQgMjRDNCAzNS4wNDU3IDEyLjk1NDMgNDQgMjQgNDRDMzUuMDQ1NyA0NCA0NCAzNS4wNDU3IDQ0IDI0QzQ0IDEyLjk1NDMgMzUuMDQ1NyA0IDI0IDRaIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxMkMxNy4zNzI2IDEyIDEyIDE3LjM3MjYgMTIgMjRDMTIgMzAuNjI3NCAxNy4zNzI2IDM2IDI0IDM2QzMwLjYyNzQgMzYgMzYgMzAuNjI3NCAzNiAyNEMzNiAxNy4zNzI2IDMwLjYyNzQgMTIgMjQgMTJaIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyMEMxOC40NzcgMjAgMTQgMjQuNDc3IDE0IDMwQzE0IDM1LjUyMyAxOC40NzcgNDAgMjQgNDBDMjkuNTIzIDQwIDM0IDM1LjUyMyAzNCAzMEMzNCAyNC40NzcgMjkuNTIzIDIwIDI0IDIwWiIgZmlsbD0iI0Q3RDlEMCIvPgo8L3N2Zz4KPC9zdmc+'
    } else {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDMyMCAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTkyIiBmaWxsPSIjRkZGN0YwIi8+CjxwYXRoIGQ9Ik0xNjAgOTZDMTQzLjQzMSA5NiAxMzAgMTA5LjQzMSAxMzAgMTI2QzEzMCAxNDIuNTY5IDE0My40MzEgMTU2IDE2MCAxNTZDMTc2LjU2OSAxNTYgMTkwIDE0Mi41NjkgMTkwIDEyNkMxOTAgMTA5LjQzMSAxNzYuNTY5IDk2IDE2MCA5NloiIGZpbGw9IiNGRkQ3MDAiLz4KPHBhdGggZD0iTTE2MCAxMzZDMTA5LjQzMSAxMzYgNjYgMTc5LjQzMSA2NiAyMzBDNjYgMjgwLjU2OSAxMDkuNDMxIDMyNCAxNjAgMzI0QzIxMC41NjkgMzI0IDI1NCAyODAuNTY5IDI1NCAyMzBDMjU0IDE3OS40MzEgMjEwLjU2OSAxMzYgMTYwIDEzNloiIGZpbGw9IiNGRkQ3MDAiLz4KPHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDQvMTAvMjAwNC1zdmciPgo8cGF0aCBkPSJNMjQgNEMxMi45NTQzIDQgNCAxMi45NTQzIDQgMjRDNCAzNS4wNDU3IDEyLjk1NDMgNDQgMjQgNDRDMzUuMDQ1NyA0NCA0NCAzNS4wNDU3IDQ0IDI0QzQ0IDEyLjk1NDMgMzUuMDQ1NyA0IDI0IDRaIiBmaWxsPSIjRkZGN0YwIi8+CjxwYXRoIGQ9Ik0yNCAxMkMxNy4zNzI2IDEyIDEyIDE3LjM3MjYgMTIgMjRDMTIgMzAuNjI3NCAxNy4zNzI2IDM2IDI0IDM2QzMwLjYyNzQgMzYgMzYgMzAuNjI3NCAzNiAyNEMzNiAxNy4zNzI2IDMwLjYyNzQgMTIgMjQgMTJaIiBmaWxsPSIjRkZGN0YwIi8+CjxwYXRoIGQ9Ik0yNCAyMEMxOC40NzcgMjAgMTQgMjQuNDc3IDE0IDMwQzE0IDM1LjUyMyAxOC40NzcgNDAgMjQgNDBDMjkuNTIzIDQwIDM0IDM1LjUyMyAzNCAzMEMzNCAyNC40NzcgMjkuNTIzIDIwIDI0IDIwWiIgZmlsbD0iI0ZGRDcwMCIvPgo8L3N2Zz4KPC9zdmc+'
    }
  }

  // Show loading while checking role or fetching data
  if (loading || roleLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Diseases & Pests</h1>
          <p className="text-gray-600 mb-6">
            Comprehensive guide to common mango tree diseases and pests, including identification, severity assessment, and control methods.
          </p>
          
          {/* Filter and Admin Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'ALL' | 'DISEASE' | 'PEST')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ALL">All</option>
                <option value="DISEASE">Diseases</option>
                <option value="PEST">Pests</option>
              </select>
            </div>
            
            {isUserAdmin && (
              <Link
                href="/diseases/create"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add New Disease/Pest
              </Link>
            )}
          </div>
        </div>

        {/* Diseases Grid */}
        {filteredDiseases.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No diseases or pests found.</div>
            {isUserAdmin && (
              <Link
                href="/diseases/create"
                className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Add the first one
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDiseases.map((disease) => (
              <div
                key={disease.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="h-48 overflow-hidden">
                  <img
                    src={getPlaceholderImage(disease)}
                    alt={disease.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Content */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{disease.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      disease.type === 'DISEASE' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {disease.type}
                    </span>
                  </div>

                  {/* Description */}
                  {disease.shortDescription && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {disease.shortDescription}
                    </p>
                  )}

                  {/* Metrics */}
                  {(disease.severity !== null || disease.spreadability !== null) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {disease.severity !== null && (
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Severity</label>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(disease.severity)}`}>
                            {disease.severity}/10
                          </div>
                        </div>
                      )}
                      {disease.spreadability !== null && (
                        <div>
                          <label className="text-xs text-gray-500 font-medium">Spreadability</label>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getSpreadabilityColor(disease.spreadability)}`}>
                            {disease.spreadability}/10
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <Link
                      href={`/diseases/${disease.id}`}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                    
                    {isUserAdmin && (
                      <div className="flex gap-2">
                        <Link
                          href={`/diseases/${disease.id}/edit`}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this disease/pest?')) {
                              try {
                                const { data: { session } } = await supabase.auth.getSession()
                                const token = session?.access_token
                                
                                const response = await fetch(`/api/diseases/${disease.id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${token || ''}`
                                  }
                                })
                                if (response.ok) {
                                  fetchDiseases()
                                } else {
                                  alert('Failed to delete disease/pest')
                                }
                              } catch (error) {
                                alert('Error deleting disease/pest')
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
