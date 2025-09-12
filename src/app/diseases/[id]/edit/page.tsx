'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import DiseaseForm from '@/components/DiseaseForm'
import { Disease } from '@/types/disease'

export default function EditDiseasePage() {
  const [disease, setDisease] = useState<Disease | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()

  useEffect(() => {
    if (params.id) {
      fetchDisease(params.id as string)
    }
  }, [params.id])

  const fetchDisease = async (id: string) => {
    try {
      const response = await fetch(`/api/diseases/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Disease not found')
        }
        throw new Error('Failed to fetch disease')
      }
      const data = await response.json()
      setDisease(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
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

  if (error || !disease) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Disease not found'}
          </div>
        </div>
      </div>
    )
  }

  return <DiseaseForm disease={disease} isEditing={true} />
}
