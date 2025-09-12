'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Disease } from '@/types/disease'
import Link from 'next/link'
import Image from 'next/image'

export default function DiseaseDetailPage() {
  const [disease, setDisease] = useState<Disease | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()

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

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'text-green-600 bg-green-100'
    if (severity <= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getSpreadabilityColor = (spreadability: number) => {
    if (spreadability <= 3) return 'text-green-600 bg-green-100'
    if (spreadability <= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || 'Disease not found'}
          </div>
          <Link
            href="/diseases"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to Diseases
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/diseases"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Diseases
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{disease.name}</h1>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  disease.type === 'DISEASE' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {disease.type}
                </span>
              </div>
            </div>
            
            <p className="text-gray-600 text-lg">{disease.shortDescription}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Image */}
              {disease.imageLink && (
                <div className="mb-8">
                  <Image
                    src={disease.imageLink}
                    alt={disease.name}
                    width={800}
                    height={256}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Long Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {disease.longDescription}
                  </p>
                </div>
              </div>

              {/* Control Methods */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Control Methods</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {disease.controlMethod}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Metrics */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Severity</label>
                    <div className={`mt-1 px-3 py-2 rounded text-sm font-medium ${getSeverityColor(disease.severity ?? 0)}`}>
                      {disease.severity ?? 'N/A'}/10
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {disease.severity ? (disease.severity <= 3 ? 'Low' : disease.severity <= 6 ? 'Medium' : 'High') : 'Unknown'} impact on tree health
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Spreadability</label>
                    <div className={`mt-1 px-3 py-2 rounded text-sm font-medium ${getSpreadabilityColor(disease.spreadability ?? 0)}`}>
                      {disease.spreadability ?? 'N/A'}/10
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {disease.spreadability ? (disease.spreadability <= 3 ? 'Low' : disease.spreadability <= 6 ? 'Medium' : 'High') : 'Unknown'} risk of spreading
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Added:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(disease.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(disease.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
