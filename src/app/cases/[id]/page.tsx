'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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
    numberOfTreesChecked: number
    numberOfTreesInfected: number
    createdAt: string
  }>
}

type Record = {
  id: string
  caseId: string | null
  orchardId: string | null
  recordedAt: string
  numberOfTreesChecked: number
  numberOfTreesInfected: number
  createdAt: string
}

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string

  const [case_, setCase] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [showEditCase, setShowEditCase] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Record | null>(null)
  const [addingRecord, setAddingRecord] = useState(false)
  const [updatingCase, setUpdatingCase] = useState(false)
  const [deletingRecordIds, setDeletingRecordIds] = useState<string[]>([])
  
  const [newRecord, setNewRecord] = useState({
    recordedAt: new Date().toISOString().split('T')[0],
    numberOfTreesChecked: 0,
    numberOfTreesInfected: 0
  })

  const [editCase, setEditCase] = useState<{
    status: string;
    partOfPlant: string;
  }>({
    status: 'ACTIVE',
    partOfPlant: 'LEAF'
  })

  const fetchCase = useCallback(async () => {
    try {
      const response = await fetch(`/api/cases/${caseId}`)
      if (response.ok) {
        const data = await response.json()
        setCase(data)
        setEditCase({
          status: data.status || 'ACTIVE',
          partOfPlant: data.partOfPlant || 'LEAF'
        })
      } else {
        console.error('Case not found')
        router.push('/cases')
      }
    } catch (error) {
      console.error('Error fetching case:', error)
    } finally {
      setLoading(false)
    }
  }, [caseId, router])

  useEffect(() => {
    if (caseId) {
      fetchCase()
    }
  }, [caseId, fetchCase])

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingRecord(true)
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newRecord,
          caseId,
          orchardId: case_?.orchardId
        }),
      })

      if (response.ok) {
        await fetchCase()
        setShowAddRecord(false)
        setNewRecord({
          recordedAt: new Date().toISOString().split('T')[0],
          numberOfTreesChecked: 0,
          numberOfTreesInfected: 0
        })
      }
    } catch (error) {
      console.error('Error adding record:', error)
    } finally {
      setAddingRecord(false)
    }
  }

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingCase(true)
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editCase,
          diseaseId: case_?.diseaseId,
          orchardId: case_?.orchardId
        }),
      })

      if (response.ok) {
        await fetchCase()
        setShowEditCase(false)
      }
    } catch (error) {
      console.error('Error updating case:', error)
    } finally {
      setUpdatingCase(false)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return

    setDeletingRecordIds(prev => [...prev, recordId])
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCase()
      }
    } catch (error) {
      console.error('Error deleting record:', error)
    } finally {
      setDeletingRecordIds(prev => prev.filter(id => id !== recordId))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading case details...</div>
        </div>
      </div>
    )
  }

  if (!case_) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Case not found</h1>
          <Link 
            href="/cases"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Cases
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/cases"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Cases
        </Link>
      </div>

      {/* Case Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {case_.disease?.name || 'Unknown Disease'}
            </h1>
            <p className="text-lg text-gray-600">
              {case_.orchard?.orchardName || 'Unknown Orchard'} - {case_.orchard?.variety.varietyName}
            </p>
            <p className="text-gray-500">
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
            <button
              onClick={() => setShowEditCase(true)}
              disabled={updatingCase || showEditCase}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Edit Case
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Plant Part Affected</p>
            <p className="font-medium">{case_.partOfPlant || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="font-medium">{case_.records.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">{new Date(case_.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-medium">{new Date(case_.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Edit Case Form */}
      {showEditCase && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Edit Case</h2>
          <form onSubmit={handleUpdateCase} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editCase.status}
                  onChange={(e) => setEditCase({ ...editCase, status: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plant Part Affected
                </label>
                <select
                  value={editCase.partOfPlant}
                  onChange={(e) => setEditCase({ ...editCase, partOfPlant: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="LEAF">Leaf</option>
                  <option value="STEM">Stem</option>
                  <option value="FRUIT">Fruit</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={updatingCase}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updatingCase && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {updatingCase ? 'Updating...' : 'Update Case'}
              </button>
              <button
                type="button"
                disabled={updatingCase}
                onClick={() => setShowEditCase(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Inspection Records</h2>
          <button
            onClick={() => setShowAddRecord(true)}
            disabled={addingRecord || showAddRecord}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Record
          </button>
        </div>

        {/* Add Record Form */}
        {showAddRecord && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-lg font-medium mb-4">Add New Record</h3>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Recorded
                  </label>
                  <input
                    type="date"
                    value={newRecord.recordedAt}
                    onChange={(e) => setNewRecord({ ...newRecord, recordedAt: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trees Checked
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRecord.numberOfTreesChecked || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, numberOfTreesChecked: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trees Infected
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newRecord.numberOfTreesInfected || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, numberOfTreesInfected: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={addingRecord}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {addingRecord && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {addingRecord ? 'Adding...' : 'Add Record'}
                </button>
                <button
                  type="button"
                  disabled={addingRecord}
                  onClick={() => setShowAddRecord(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Records List */}
        {case_.records.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No records found for this case.</p>
            <p className="text-gray-400 text-sm">Add your first inspection record to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {case_.records.map((record) => {
              const infectionRate = record.numberOfTreesChecked > 0 
                ? ((record.numberOfTreesInfected / record.numberOfTreesChecked) * 100).toFixed(1)
                : '0'

              return (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(record.recordedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Recorded on {new Date(record.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      disabled={deletingRecordIds.includes(record.id)}
                      className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {deletingRecordIds.includes(record.id) && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                      )}
                      {deletingRecordIds.includes(record.id) ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Trees Checked</p>
                      <p className="font-medium">{record.numberOfTreesChecked}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Trees Infected</p>
                      <p className="font-medium">{record.numberOfTreesInfected}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Infection Rate</p>
                      <p className="font-medium">{infectionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        parseFloat(infectionRate) > 20
                          ? 'bg-red-100 text-red-800'
                          : parseFloat(infectionRate) > 10
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {parseFloat(infectionRate) > 20 ? 'High Risk' 
                         : parseFloat(infectionRate) > 10 ? 'Medium Risk' 
                         : 'Low Risk'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}