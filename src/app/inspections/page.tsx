'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { InspectionRecommendation } from '@/lib/inspection-service'

 *    - No recent data: 80 points (conservative)
 */

export default function InspectionsPage() {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<InspectionRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchOrchardsAndCalculateRisk()
    }
  }, [user])

  const fetchOrchardsAndCalculateRisk = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) return

      // Use the new API endpoint for inspection recommendations
      const response = await fetch('/api/inspections', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        console.error('Failed to fetch inspection recommendations')
        return
      }

      const data = await response.json()
      if (data.success) {
        setRecommendations(data.recommendations || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

      const maxSpreadability = Math.max(...orchard.cases.map(c => c.disease.spreadability || 0))
      casesRisk = ((maxSeverity + maxSpreadability) / 20) * 100
      
      if (casesRisk > 70) {
        reasons.push(`High-risk active diseases detected (severity: ${maxSeverity}, spread: ${maxSpreadability})`)
      } else if (casesRisk > 40) {
        reasons.push(`Moderate-risk active diseases present`)
      }
    }

    // 2. ENVIRONMENTAL RISK (25% weight)
    const varietyRisk = (orchard.variety.varietySusceptability / 10) * 100
    const locationRisk = (orchard.location.locationSusceptability / 10) * 100
    const environmentalRisk = (varietyRisk + locationRisk) / 2
    
    if (environmentalRisk > 60) {
      reasons.push(`High environmental risk (variety: ${orchard.variety.varietySusceptability}/10, location: ${orchard.location.locationSusceptability}/10)`)
    }

    // 3. DENSITY RISK (15% weight)
    const totalTrees = orchard.noTreesRow * orchard.noTreesColumn
    const treesPerHectare = totalTrees / orchard.area
    let densityRisk = 20 // Low density default
    
    if (treesPerHectare > 800) {
      densityRisk = 100
      reasons.push(`Very high tree density (${Math.round(treesPerHectare)} trees/hectare)`)
    } else if (treesPerHectare > 400) {
      densityRisk = 50
      reasons.push(`Moderate tree density (${Math.round(treesPerHectare)} trees/hectare)`)
    }

    // 4. TIME RISK (15% weight)
    let timeRisk = 100 // Assume no recent inspection
    let lastInspection: string | undefined
    
    // Find most recent inspection across ALL cases (including resolved ones)
    const allRecords = (orchard.allCases || orchard.cases).flatMap(c => c.records || [])
    if (allRecords.length > 0) {
      const sortedRecords = allRecords.sort((a, b) => 
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      )
      const mostRecent = sortedRecords[0]
      lastInspection = mostRecent.recordedAt
      
      const daysSinceLastInspection = Math.floor(
        (Date.now() - new Date(mostRecent.recordedAt).getTime()) / (1000 * 60 * 60 * 24)
      )

  const getFrequencyDisplay = (frequency: string) => {
    switch (frequency) {
      case 'DAILY': return { text: 'Daily', color: 'text-red-800 bg-red-100', days: 1 }
      case 'THREE_DAYS': return { text: 'Every 3 Days', color: 'text-yellow-800 bg-yellow-100', days: 3 }
      case 'WEEKLY': return { text: 'Weekly', color: 'text-green-800 bg-green-100', days: 7 }
      default: return { text: 'Unknown', color: 'text-gray-800 bg-gray-100', days: 7 }
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { text: 'High', color: 'text-red-800 bg-red-100' }
    if (score >= 40) return { text: 'Moderate', color: 'text-yellow-800 bg-yellow-100' }
    return { text: 'Low', color: 'text-green-800 bg-green-100' }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading inspection recommendations...</div>
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
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Inspection Recommendations</h1>
        <p className="text-gray-600">
          AI-powered recommendations for optimal orchard inspection frequency based on risk analysis.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orchards found.</p>
          <p className="text-gray-400">Create an orchard to get inspection recommendations.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {recommendations.map(rec => {
            const frequencyDisplay = getFrequencyDisplay(rec.frequency)
            const riskLevel = getRiskLevel(rec.riskScore)

            return (
              <div key={rec.orchardId} className="bg-white rounded-lg shadow-md p-6 border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {rec.orchardName}
                    </h3>
                    <p className="text-gray-600">
                      {rec.varietyName} - {rec.locationName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskLevel.color}`}>
                        {riskLevel.text} Risk
                      </span>
                      <p className="text-sm text-gray-500 mt-1">Score: {rec.riskScore}/100</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Recommended Frequency</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${frequencyDisplay.color}`}>
                      {frequencyDisplay.text}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Cases</p>
                    <p className="font-medium">{rec.activeCases}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Inspection</p>
                    <p className="font-medium">
                      {rec.lastInspection 
                        ? new Date(rec.lastInspection).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Next Due</p>
                    <p className="font-medium">
                      {rec.nextInspectionDate 
                        ? new Date(rec.nextInspectionDate).toLocaleDateString()
                        : 'TBD'
                      }
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Risk Breakdown:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>Cases: {rec.riskBreakdown.casesRisk}%</div>
                    <div>Environment: {rec.riskBreakdown.environmentalRisk}%</div>
                    <div>Density: {rec.riskBreakdown.densityRisk}%</div>
                    <div>Time: {rec.riskBreakdown.timeRisk}%</div>
                    <div>Seasonal: {rec.riskBreakdown.seasonalRisk}%</div>
                    <div>Coverage: {rec.riskBreakdown.coverageRisk}%</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Algorithm Information */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">How Recommendations Work</h2>
        <div className="text-blue-800 text-sm space-y-2">
          <p>Our AI algorithm considers multiple factors to determine optimal inspection frequency:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
            <li>• <strong>Active Disease Cases</strong> (30%): Severity and spread risk</li>
            <li>• <strong>Environmental Factors</strong> (25%): Variety and location susceptibility</li>
            <li>• <strong>Tree Density</strong> (15%): Higher density increases risk</li>
            <li>• <strong>Time Since Inspection</strong> (15%): Longer gaps increase risk</li>
            <li>• <strong>Seasonal Risk</strong> (10%): Peak seasons require more attention</li>
            <li>• <strong>Inspection Coverage</strong> (5%): Thoroughness of recent checks</li>
          </ul>
          <div className="mt-4 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Risk Score Mapping:</strong> High Risk (≥70): Daily • 
              Medium Risk (40-69): Every 3 Days • Low Risk (<40): Weekly
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}