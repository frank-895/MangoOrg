'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type UpcomingInspection = {
  orchardId: string
  orchardName: string
  varietyName: string
  locationName: string
  lastInspection?: string
  nextInspection: string
  daysUntilDue: number
  frequency: 'DAILY' | 'THREE_DAYS' | 'WEEKLY'
  status: 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'ON_TRACK'
  activeCases: number
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckLoading, setAdminCheckLoading] = useState(true)
  const [upcomingInspections, setUpcomingInspections] = useState<UpcomingInspection[]>([])
  const [inspectionsLoading, setInspectionsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      checkAdminStatus()
      fetchUpcomingInspections()
    }
  }, [user, loading, router])

  const checkAdminStatus = async () => {
    if (!user) {
      setAdminCheckLoading(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (token) {
        const response = await fetch('/api/auth/admin', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin)
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    } finally {
      setAdminCheckLoading(false)
    }
  }

  const fetchUpcomingInspections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        setInspectionsLoading(false)
        return
      }

      // Fetch orchards with all related data (same logic as inspections page)
      const response = await fetch('/api/orchards', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        setInspectionsLoading(false)
        return
      }

      const data = await response.json()
      const orchardsData = data.orchards || []

      // Fetch cases and calculate inspections for each orchard
      const inspections = await Promise.all(
        orchardsData.map(async (orchard: any) => {
          const casesResponse = await fetch('/api/cases')
          if (casesResponse.ok) {
            const allCases = await casesResponse.json()
            // Get ALL cases for this orchard (both ACTIVE and RESOLVED) for inspection records
            const orchardCases = allCases.filter((case_: any) => 
              case_.orchardId === orchard.id
            )
            // But separate active cases for risk calculation
            const activeCases = orchardCases.filter((case_: any) => case_.status === 'ACTIVE')

            // Fetch records for ALL cases (for inspection history)
            const allCasesWithRecords = await Promise.all(
              orchardCases.map(async (case_: any) => {
                const recordsResponse = await fetch(`/api/records?caseId=${case_.id}`)
                if (recordsResponse.ok) {
                  const records = await recordsResponse.json()
                  return { ...case_, records }
                }
                return { ...case_, records: [] }
              })
            )

            // Fetch records for ACTIVE cases only (for risk calculation)
            const activeCasesWithRecords = await Promise.all(
              activeCases.map(async (case_: any) => {
                const recordsResponse = await fetch(`/api/records?caseId=${case_.id}`)
                if (recordsResponse.ok) {
                  const records = await recordsResponse.json()
                  return { ...case_, records }
                }
                return { ...case_, records: [] }
              })
            )

            return calculateUpcomingInspection({ 
              ...orchard, 
              cases: activeCasesWithRecords, // For risk calculation
              allCases: allCasesWithRecords // For inspection history
            })
          }
          return calculateUpcomingInspection({ ...orchard, cases: [], allCases: [] })
        })
      )

      // Sort by urgency (overdue first, then by days until due)
      const sortedInspections = inspections.sort((a, b) => {
        if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1
        if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1
        if (a.status === 'DUE_TODAY' && b.status !== 'DUE_TODAY') return -1
        if (b.status === 'DUE_TODAY' && a.status !== 'DUE_TODAY') return 1
        return a.daysUntilDue - b.daysUntilDue
      })

      setUpcomingInspections(sortedInspections)
    } catch (error) {
      console.error('Error fetching upcoming inspections:', error)
    } finally {
      setInspectionsLoading(false)
    }
  }

  const calculateUpcomingInspection = (orchard: any): UpcomingInspection => {
    // Use the same risk calculation logic from inspections page
    const casesRisk = orchard.cases.length > 0 
      ? ((Math.max(...orchard.cases.map((c: any) => c.disease?.severity || 0)) +
          Math.max(...orchard.cases.map((c: any) => c.disease?.spreadability || 0))) / 20) * 100
      : 0

    const varietyRisk = (orchard.variety.varietySusceptability / 10) * 100
    const locationRisk = (orchard.location.locationSusceptability / 10) * 100
    const environmentalRisk = (varietyRisk + locationRisk) / 2

    const totalTrees = orchard.noTreesRow * orchard.noTreesColumn
    const treesPerHectare = totalTrees / orchard.area
    let densityRisk = 20
    if (treesPerHectare > 800) densityRisk = 100
    else if (treesPerHectare > 400) densityRisk = 50

    // Find most recent inspection across ALL cases (including resolved ones)
    const allRecords = (orchard.allCases || orchard.cases).flatMap((c: any) => c.records || [])
    let timeRisk = 100
    let lastInspection: string | undefined
    
    if (allRecords.length > 0) {
      const sortedRecords = allRecords.sort((a: any, b: any) => 
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      )
      lastInspection = sortedRecords[0].recordedAt
    }

    // Calculate seasonal risk
    const now = new Date()
    const month = now.getMonth() + 1
    const adjustedMonth = orchard.location.hemisphere === 'SOUTH' ? 
      (month <= 6 ? month + 6 : month - 6) : month
    
    let seasonalRisk = 20
    if (adjustedMonth >= 3 && adjustedMonth <= 5) seasonalRisk = 90
    else if (adjustedMonth >= 6 && adjustedMonth <= 8) seasonalRisk = 80
    else if (adjustedMonth >= 9 && adjustedMonth <= 11) seasonalRisk = 50

    const coverageRisk = 80 // Conservative default

    // Calculate final risk score
    const finalRisk = Math.round(
      (casesRisk * 0.30) +
      (environmentalRisk * 0.25) +
      (densityRisk * 0.15) +
      (timeRisk * 0.15) +
      (seasonalRisk * 0.10) +
      (coverageRisk * 0.05)
    )

    // Determine frequency
    let frequency: 'DAILY' | 'THREE_DAYS' | 'WEEKLY'
    let intervalDays: number
    if (finalRisk >= 70) {
      frequency = 'DAILY'
      intervalDays = 1
    } else if (finalRisk >= 40) {
      frequency = 'THREE_DAYS'
      intervalDays = 3
    } else {
      frequency = 'WEEKLY'
      intervalDays = 7
    }

    // Calculate next inspection date and status
    const lastInspectionDate = lastInspection ? new Date(lastInspection) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let nextInspectionDate: Date
    let daysUntilDue: number
    
    if (lastInspectionDate) {
      nextInspectionDate = new Date(lastInspectionDate)
      nextInspectionDate.setDate(nextInspectionDate.getDate() + intervalDays)
      daysUntilDue = Math.ceil((nextInspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    } else {
      // No previous inspection - due immediately
      nextInspectionDate = today
      daysUntilDue = 0
    }

    // Determine status
    let status: UpcomingInspection['status']
    if (daysUntilDue < 0) status = 'OVERDUE'
    else if (daysUntilDue === 0) status = 'DUE_TODAY'
    else if (daysUntilDue <= 2) status = 'DUE_SOON'
    else status = 'ON_TRACK'

    return {
      orchardId: orchard.id,
      orchardName: orchard.orchardName,
      varietyName: orchard.variety.varietyName,
      locationName: orchard.location.locationName,
      lastInspection,
      nextInspection: nextInspectionDate.toISOString(),
      daysUntilDue,
      frequency,
      status,
      activeCases: orchard.cases.length
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-gray-600">
                {user.user_metadata?.display_name || user.email}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/orchards" className="bg-green-50 p-6 rounded-lg hover:bg-green-100 transition-colors">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Orchards</h3>
                <p className="text-green-600">Manage your mango orchards</p>
              </Link>
              <Link href="/cases" className="bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition-colors">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Cases</h3>
                <p className="text-blue-600">Track disease cases and records</p>
              </Link>
              <Link href="/inspections" className="bg-purple-50 p-6 rounded-lg hover:bg-purple-100 transition-colors">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Inspections</h3>
                <p className="text-purple-600">Plan your upcoming inspections</p>
              </Link>
              <Link href="/diseases" className="bg-orange-50 p-6 rounded-lg hover:bg-orange-100 transition-colors">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Diseases & Pests</h3>
                <p className="text-orange-600">Explore our database of diseases</p>
              </Link>
            </div>

            {/* Upcoming Inspections Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Inspections</h2>
                <Link 
                  href="/inspections"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  View All Recommendations →
                </Link>
              </div>

              {inspectionsLoading ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Loading inspections...</span>
                  </div>
                </div>
              ) : upcomingInspections.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">No orchards found.</p>
                    <p className="text-gray-400">Create an orchard to get inspection schedules.</p>
                    <Link 
                      href="/orchards"
                      className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Create Your First Orchard
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {upcomingInspections.slice(0, 5).map(inspection => {
                    const getStatusDisplay = (status: UpcomingInspection['status']) => {
                      switch (status) {
                        case 'OVERDUE':
                          return { text: 'OVERDUE', color: 'bg-red-100 text-red-800 border-red-200' }
                        case 'DUE_TODAY':
                          return { text: 'DUE TODAY', color: 'bg-orange-100 text-orange-800 border-orange-200' }
                        case 'DUE_SOON':
                          return { text: 'DUE SOON', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
                        case 'ON_TRACK':
                          return { text: 'ON TRACK', color: 'bg-green-100 text-green-800 border-green-200' }
                      }
                    }

                    const getFrequencyDisplay = (freq: UpcomingInspection['frequency']) => {
                      switch (freq) {
                        case 'DAILY': return 'Daily'
                        case 'THREE_DAYS': return 'Every 3 Days'
                        case 'WEEKLY': return 'Weekly'
                      }
                    }

                    const getDaysUntilText = (days: number) => {
                      if (days < 0) return `${Math.abs(days)} days overdue`
                      if (days === 0) return 'Due today'
                      if (days === 1) return 'Due tomorrow'
                      return `Due in ${days} days`
                    }

                    const statusDisplay = getStatusDisplay(inspection.status)
                    const isUrgent = inspection.status === 'OVERDUE' || inspection.status === 'DUE_TODAY'

                    return (
                      <div 
                        key={inspection.orchardId} 
                        className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                          isUrgent ? 'border-l-red-500' : 'border-l-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {inspection.orchardName}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {inspection.varietyName} • {inspection.locationName}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusDisplay.color}`}>
                                {statusDisplay.text}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Schedule</p>
                                <p className="font-medium">{getFrequencyDisplay(inspection.frequency)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Timeline</p>
                                <p className="font-medium">{getDaysUntilText(inspection.daysUntilDue)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Active Cases</p>
                                <p className="font-medium">{inspection.activeCases}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Last Check</p>
                                <p className="font-medium">
                                  {inspection.lastInspection 
                                    ? new Date(inspection.lastInspection).toLocaleDateString()
                                    : 'Never'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="ml-4 flex flex-col gap-2">
                            {inspection.activeCases > 0 && (
                              <Link
                                href={`/cases`}
                                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors text-center"
                              >
                                View Cases
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {upcomingInspections.length > 5 && (
                    <div className="text-center mt-4">
                      <Link 
                        href="/inspections"
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        View All {upcomingInspections.length} Inspections →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin Section - Only show for admin users */}
            {adminCheckLoading ? (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 p-6 rounded-lg animate-pulse">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-6 rounded-lg animate-pulse">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : isAdmin ? (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link href="/admin" className="bg-purple-50 border-2 border-purple-200 p-6 rounded-lg hover:bg-purple-100 transition-colors">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-purple-800 mb-2">System Management</h3>
                        <p className="text-purple-600">Manage locations and varieties for all users</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/diseases/create" className="bg-red-50 border-2 border-red-200 p-6 rounded-lg hover:bg-red-100 transition-colors">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Disease Management</h3>
                        <p className="text-red-600">Add and edit disease/pest information</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </div>
  )
}
