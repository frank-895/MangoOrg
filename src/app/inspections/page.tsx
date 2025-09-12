'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Orchard = {
  id: string
  orchardName: string
  noTreesRow: number
  noTreesColumn: number
  area: number
  location: {
    locationName: string
    hemisphere: 'NORTH' | 'SOUTH'
    locationSusceptability: number
  }
  variety: {
    varietyName: string
    varietySusceptability: number
  }
  cases: Array<{
    id: string
    status: string
    disease: {
      severity: number
      spreadability: number
    }
    records: Array<{
      recordedAt: string
      numberOfTreesChecked: number
    }>
  }>
}

type InspectionRecommendation = {
  orchardId: string
  riskScore: number
  frequency: 'DAILY' | 'THREE_DAYS' | 'WEEKLY'
  reasons: string[]
  lastInspection?: string
  activeCases: number
}

/**
 * INSPECTION FREQUENCY ALGORITHM
 * =============================
 * 
 * This algorithm calculates a risk score (0-100) for each orchard and recommends
 * inspection frequency based on multiple weighted factors:
 * 
 * WEIGHTS (Total = 100):
 * - Active Cases Risk: 30% (disease severity + spreadability)
 * - Environmental Risk: 25% (variety + location susceptibility)
 * - Density Risk: 15% (trees per hectare)
 * - Time Risk: 15% (days since last inspection)
 * - Seasonal Risk: 10% (hemisphere + current season)
 * - Inspection Coverage: 5% (portion of trees typically checked)
 * 
 * FREQUENCY MAPPING:
 * - 70+ Risk Score: Daily inspections
 * - 40-69 Risk Score: Every 3 days
 * - <40 Risk Score: Weekly inspections
 * 
 * SCORING DETAILS:
 * 
 * 1. ACTIVE CASES RISK (0-100 points, 30% weight):
 *    - Uses worst-case disease severity (0-10) and spreadability (0-10)
 *    - Formula: ((max_severity + max_spreadability) / 20) * 100
 *    - If no active cases: 0 points
 * 
 * 2. ENVIRONMENTAL RISK (0-100 points, 25% weight):
 *    - Variety susceptibility (0-10) + Location susceptibility (0-10)
 *    - Formula: ((variety_score + location_score) / 20) * 100
 * 
 * 3. DENSITY RISK (0-100 points, 15% weight):
 *    - Trees per hectare calculation
 *    - <400 trees/ha: 20 points
 *    - 400-800 trees/ha: 50 points
 *    - >800 trees/ha: 100 points
 * 
 * 4. TIME RISK (0-100 points, 15% weight):
 *    - Days since last inspection record
 *    - 0-3 days: 10 points
 *    - 4-7 days: 30 points
 *    - 8-14 days: 60 points
 *    - 15+ days: 100 points
 * 
 * 5. SEASONAL RISK (0-100 points, 10% weight):
 *    - Based on hemisphere and current month
 *    - Peak season (spring/summer): 80-100 points
 *    - Moderate season (autumn): 40-60 points
 *    - Low season (winter): 20 points
 * 
 * 6. INSPECTION COVERAGE (0-100 points, 5% weight):
 *    - Based on recent inspection thoroughness
 *    - <10% trees checked: 100 points
 *    - 10-25% trees checked: 60 points
 *    - >25% trees checked: 20 points
 *    - No recent data: 80 points (conservative)
 */

export default function InspectionsPage() {
  const { user } = useAuth()
  const [orchards, setOrchards] = useState<Orchard[]>([])
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

      // Fetch orchards with all related data
      const response = await fetch('/api/orchards', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) return

      const data = await response.json()
      const orchardsData = data.orchards || []

      // Fetch cases for each orchard
      const orchardsWithCases = await Promise.all(
        orchardsData.map(async (orchard: any) => {
          const casesResponse = await fetch('/api/cases')
          if (casesResponse.ok) {
            const allCases = await casesResponse.json()
            const orchardCases = allCases.filter((case_: any) => 
              case_.orchardId === orchard.id && case_.status === 'ACTIVE'
            )

            // Fetch records for each case
            const casesWithRecords = await Promise.all(
              orchardCases.map(async (case_: any) => {
                const recordsResponse = await fetch(`/api/records?caseId=${case_.id}`)
                if (recordsResponse.ok) {
                  const records = await recordsResponse.json()
                  return { ...case_, records }
                }
                return { ...case_, records: [] }
              })
            )

            return { ...orchard, cases: casesWithRecords }
          }
          return { ...orchard, cases: [] }
        })
      )

      setOrchards(orchardsWithCases)
      
      // Calculate recommendations
      const recs = orchardsWithCases.map(orchard => 
        calculateInspectionRecommendation(orchard)
      )
      setRecommendations(recs)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateInspectionRecommendation = (orchard: Orchard): InspectionRecommendation => {
    const reasons: string[] = []
    
    // 1. ACTIVE CASES RISK (30% weight)
    let casesRisk = 0
    if (orchard.cases.length > 0) {
      const maxSeverity = Math.max(...orchard.cases.map(c => c.disease.severity || 0))
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
    
    // Find most recent inspection across all cases
    const allRecords = orchard.cases.flatMap(c => c.records)
    if (allRecords.length > 0) {
      const sortedRecords = allRecords.sort((a, b) => 
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      )
      const mostRecent = sortedRecords[0]
      lastInspection = mostRecent.recordedAt
      
      const daysSinceLastInspection = Math.floor(
        (Date.now() - new Date(mostRecent.recordedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceLastInspection <= 3) timeRisk = 10
      else if (daysSinceLastInspection <= 7) timeRisk = 30
      else if (daysSinceLastInspection <= 14) timeRisk = 60
      else timeRisk = 100
      
      if (daysSinceLastInspection > 14) {
        reasons.push(`No inspection in ${daysSinceLastInspection} days`)
      }
    } else {
      reasons.push('No previous inspection records found')
    }

    // 5. SEASONAL RISK (10% weight)
    const seasonalRisk = calculateSeasonalRisk(orchard.location.hemisphere)
    if (seasonalRisk > 70) {
      reasons.push('Peak disease/pest season')
    }

    // 6. INSPECTION COVERAGE (5% weight)
    let coverageRisk = 80 // Conservative default
    if (allRecords.length > 0) {
      const recentRecords = allRecords.filter(r => 
        (Date.now() - new Date(r.recordedAt).getTime()) < (30 * 24 * 60 * 60 * 1000)
      )
      
      if (recentRecords.length > 0) {
        const avgCoverage = recentRecords.reduce((sum, r) => 
          sum + (r.numberOfTreesChecked / totalTrees), 0
        ) / recentRecords.length
        
        if (avgCoverage < 0.1) coverageRisk = 100
        else if (avgCoverage < 0.25) coverageRisk = 60
        else coverageRisk = 20
        
        if (avgCoverage < 0.1) {
          reasons.push('Low inspection coverage (<10% of trees)')
        }
      }
    }

    // WEIGHTED RISK CALCULATION
    const finalRisk = Math.round(
      (casesRisk * 0.30) +
      (environmentalRisk * 0.25) +
      (densityRisk * 0.15) +
      (timeRisk * 0.15) +
      (seasonalRisk * 0.10) +
      (coverageRisk * 0.05)
    )

    // FREQUENCY MAPPING
    let frequency: 'DAILY' | 'THREE_DAYS' | 'WEEKLY'
    if (finalRisk >= 70) frequency = 'DAILY'
    else if (finalRisk >= 40) frequency = 'THREE_DAYS'
    else frequency = 'WEEKLY'

    return {
      orchardId: orchard.id,
      riskScore: finalRisk,
      frequency,
      reasons,
      lastInspection,
      activeCases: orchard.cases.length
    }
  }

  const calculateSeasonalRisk = (hemisphere: 'NORTH' | 'SOUTH'): number => {
    const now = new Date()
    const month = now.getMonth() + 1 // 1-12
    
    // Adjust for hemisphere (opposite seasons)
    const adjustedMonth = hemisphere === 'SOUTH' ? 
      (month <= 6 ? month + 6 : month - 6) : month

    // Northern hemisphere seasonal risk
    if (adjustedMonth >= 3 && adjustedMonth <= 5) return 90 // Spring - peak risk
    if (adjustedMonth >= 6 && adjustedMonth <= 8) return 80 // Summer - high risk
    if (adjustedMonth >= 9 && adjustedMonth <= 11) return 50 // Autumn - moderate risk
    return 20 // Winter - low risk
  }

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
            const orchard = orchards.find(o => o.id === rec.orchardId)
            if (!orchard) return null

            const frequencyDisplay = getFrequencyDisplay(rec.frequency)
            const riskLevel = getRiskLevel(rec.riskScore)

            return (
              <div key={rec.orchardId} className="bg-white rounded-lg shadow-md p-6 border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {orchard.orchardName}
                    </h3>
                    <p className="text-gray-600">
                      {orchard.variety.varietyName} - {orchard.location.locationName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {orchard.noTreesRow * orchard.noTreesColumn} trees on {orchard.area} hectares
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Risk Factors:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
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
        </div>
      </div>
    </div>
  )
}