/**
 * Inspection Service - AI-Powered Risk Analysis & Inspection Scheduling
 * 
 * This service implements a sophisticated risk assessment algorithm to determine
 * optimal inspection schedules for mango orchards. It considers multiple risk factors
 * and provides intelligent recommendations for disease management.
 * 
 * @author MangoOrg Team
 * @version 1.0.0
 */

import { prisma } from './prisma'

/**
 * Represents an inspection recommendation for a specific orchard
 */
export interface InspectionRecommendation {
  orchardId: string
  orchardName: string
  varietyName: string
  locationName: string
  riskScore: number
  frequency: 'DAILY' | 'THREE_DAYS' | 'WEEKLY'
  nextInspectionDate: string
  daysUntilDue: number
  status: 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'ON_TRACK'
  lastInspection?: string
  activeCases: number
  riskBreakdown: {
    casesRisk: number
    environmentalRisk: number
    densityRisk: number
    timeRisk: number
    seasonalRisk: number
    coverageRisk: number
  }
}

/**
 * Represents a minimal inspection for dashboard display
 */
export interface UpcomingInspection {
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

/**
 * AI-Powered Risk Assessment Algorithm
 * 
 * This algorithm calculates inspection recommendations based on a weighted risk analysis
 * considering multiple environmental, biological, and operational factors.
 * 
 * ## Risk Factors & Weights:
 * 
 * ### 1. Active Cases Risk (30% weight)
 * - Analyzes severity and spreadability of diseases/pests in active cases
 * - Higher severity diseases require more frequent monitoring
 * - Spreadable diseases pose greater risk to orchard health
 * 
 * ### 2. Environmental Risk (25% weight)
 * - Variety Susceptibility: Genetic predisposition to diseases
 * - Location Susceptibility: Regional disease pressure and climate conditions
 * - Combined score reflects baseline environmental risk
 * 
 * ### 3. Density Risk (15% weight)
 * - Tree density affects disease spread and monitoring difficulty
 * - High density (>800 trees/hectare): Maximum risk
 * - Medium density (400-800 trees/hectare): Moderate risk
 * - Low density (<400 trees/hectare): Minimal risk
 * 
 * ### 4. Time Risk (15% weight)
 * - Time since last inspection affects risk accumulation
 * - Immediate risk (0-1 days): Low risk (20%)
 * - Recent inspection (2-3 days): Low-moderate risk (40%)
 * - Moderate gap (4-7 days): Moderate risk (60%)
 * - Long gap (8-14 days): High risk (80%)
 * - Extended gap (>14 days): Maximum risk (100%)
 * 
 * ### 5. Seasonal Risk (10% weight)
 * - Hemisphere-aware seasonal disease pressure
 * - Peak season (Spring): 90% risk - Critical growing period
 * - High season (Summer): 80% risk - Active growth and fruiting
 * - Moderate season (Autumn): 50% risk - Harvest and post-harvest
 * - Low season (Winter): 20% risk - Dormant period
 * 
 * ### 6. Inspection Coverage (5% weight)
 * - Historical inspection thoroughness and consistency
 * - Currently uses conservative default (80%) pending implementation
 * - Future enhancement: Calculate based on actual inspection records
 * 
 * ## Frequency Determination:
 * - High Risk (≥70%): Daily inspections
 * - Medium Risk (40-69%): Every 3 days
 * - Low Risk (<40%): Weekly inspections
 * 
 * ## Status Classification:
 * - OVERDUE: Past due date (negative days)
 * - DUE_TODAY: Due today (0 days)
 * - DUE_SOON: Due within 2 days
 * - ON_TRACK: More than 2 days until due
 * 
 * @param orchardId The ID of the orchard to analyze
 * @param userId Optional user ID for authorization
 * @returns Promise<InspectionRecommendation> Detailed inspection recommendation
 */
export async function calculateInspectionRecommendation(
  orchardId: string,
  userId?: string
): Promise<InspectionRecommendation | null> {
  try {
    // Fetch orchard with all related data
    const orchard = await prisma.orchard.findUnique({
      where: { id: orchardId },
      include: {
        location: true,
        variety: true,
        cases: {
          where: { status: 'ACTIVE' },
          include: {
            disease: true,
            records: {
              orderBy: { recordedAt: 'desc' }
            }
          }
        }
      }
    })

    if (!orchard) {
      return null
    }

    // Authorization check
    if (userId && orchard.userId !== userId) {
      throw new Error('Unauthorized: User does not own this orchard')
    }

    // Fetch ALL cases (including resolved) for inspection history
    const allCases = await prisma.case.findMany({
      where: { orchardId },
      include: {
        records: {
          orderBy: { recordedAt: 'desc' }
        }
      }
    })

    return calculateRecommendationFromData(orchard, allCases)
  } catch (error) {
    console.error('Error calculating inspection recommendation:', error)
    throw error
  }
}

/**
 * Calculate inspection recommendations for all orchards owned by a user
 * 
 * @param userId The ID of the user
 * @returns Promise<InspectionRecommendation[]> Array of recommendations
 */
export async function calculateUserInspectionRecommendations(
  userId: string
): Promise<InspectionRecommendation[]> {
  try {
    const orchards = await prisma.orchard.findMany({
      where: { userId },
      include: {
        location: true,
        variety: true,
        cases: {
          where: { status: 'ACTIVE' },
          include: {
            disease: true,
            records: {
              orderBy: { recordedAt: 'desc' }
            }
          }
        }
      }
    })

    const recommendations = await Promise.all(
      orchards.map(async (orchard) => {
        // Fetch ALL cases for this orchard for inspection history
        const allCases = await prisma.case.findMany({
          where: { orchardId: orchard.id },
          include: {
            records: {
              orderBy: { recordedAt: 'desc' }
            }
          }
        })

        return calculateRecommendationFromData(orchard, allCases)
      })
    )

    return recommendations
  } catch (error) {
    console.error('Error calculating user inspection recommendations:', error)
    throw error
  }
}

/**
 * Calculate simplified upcoming inspections for dashboard display
 * 
 * @param userId The ID of the user
 * @returns Promise<UpcomingInspection[]> Array of upcoming inspections
 */
export async function calculateUpcomingInspections(
  userId: string
): Promise<UpcomingInspection[]> {
  const recommendations = await calculateUserInspectionRecommendations(userId)
  
  // Convert to simplified format and sort by urgency
  const upcomingInspections: UpcomingInspection[] = recommendations.map(rec => ({
    orchardId: rec.orchardId,
    orchardName: rec.orchardName,
    varietyName: rec.varietyName,
    locationName: rec.locationName,
    lastInspection: rec.lastInspection,
    nextInspection: rec.nextInspectionDate,
    daysUntilDue: rec.daysUntilDue,
    frequency: rec.frequency,
    status: rec.status,
    activeCases: rec.activeCases
  }))

  // Sort by urgency (overdue first, then by days until due)
  return upcomingInspections.sort((a, b) => {
    if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1
    if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1
    if (a.status === 'DUE_TODAY' && b.status !== 'DUE_TODAY') return -1
    if (b.status === 'DUE_TODAY' && a.status !== 'DUE_TODAY') return 1
    return a.daysUntilDue - b.daysUntilDue
  })
}

/**
 * Core recommendation calculation logic
 * 
 * @param orchard Orchard data with relations
 * @param allCases All cases (active + resolved) for inspection history
 * @returns InspectionRecommendation
 */
function calculateRecommendationFromData(orchard: any, allCases: any[]): InspectionRecommendation {
  // 1. ACTIVE CASES RISK (30% weight)
  // Analyze severity and spreadability of diseases in ACTIVE cases only
  const activeCases = orchard.cases || []
  let casesRisk = 0
  
  if (activeCases.length > 0) {
    const maxSeverity = Math.max(...activeCases.map((c: any) => c.disease?.severity || 0))
    const maxSpreadability = Math.max(...activeCases.map((c: any) => c.disease?.spreadability || 0))
    casesRisk = ((maxSeverity + maxSpreadability) / 20) * 100
  }

  // 2. ENVIRONMENTAL RISK (25% weight)
  // Combine variety and location susceptibility
  const varietyRisk = (orchard.variety.varietySusceptability / 10) * 100
  const locationRisk = (orchard.location.locationSusceptability / 10) * 100
  const environmentalRisk = (varietyRisk + locationRisk) / 2

  // 3. DENSITY RISK (15% weight)
  // Calculate tree density and associated risk
  const totalTrees = orchard.noTreesRow * orchard.noTreesColumn
  const treesPerHectare = totalTrees / orchard.area
  let densityRisk = 20 // Base risk for low density
  if (treesPerHectare > 800) densityRisk = 100      // High density
  else if (treesPerHectare > 400) densityRisk = 50   // Medium density

  // 4. TIME RISK (15% weight)
  // Find most recent inspection across ALL cases (including resolved ones)
  const allRecords = allCases.flatMap((c: any) => c.records || [])
  let timeRisk = 100 // Maximum risk if no inspections
  let lastInspection: string | undefined

  if (allRecords.length > 0) {
    const sortedRecords = allRecords.sort((a: any, b: any) => 
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    )
    lastInspection = sortedRecords[0].recordedAt
    
    const daysSinceLastInspection = Math.floor(
      (Date.now() - new Date(lastInspection).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // Calculate time-based risk
    if (daysSinceLastInspection <= 1) timeRisk = 20       // Recent inspection
    else if (daysSinceLastInspection <= 3) timeRisk = 40  // Within 3 days
    else if (daysSinceLastInspection <= 7) timeRisk = 60  // Within a week
    else if (daysSinceLastInspection <= 14) timeRisk = 80 // Within two weeks
    else timeRisk = 100                                   // Over two weeks
  }

  // 5. SEASONAL RISK (10% weight)
  // Hemisphere-aware seasonal disease pressure
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  
  // Adjust for hemisphere (flip seasons for Southern Hemisphere)
  const adjustedMonth = orchard.location.hemisphere === 'SOUTH' ? 
    (month <= 6 ? month + 6 : month - 6) : month
  
  let seasonalRisk = 20 // Base winter risk
  if (adjustedMonth >= 3 && adjustedMonth <= 5) seasonalRisk = 90      // Spring - Critical
  else if (adjustedMonth >= 6 && adjustedMonth <= 8) seasonalRisk = 80  // Summer - High  
  else if (adjustedMonth >= 9 && adjustedMonth <= 11) seasonalRisk = 50 // Autumn - Moderate

  // 6. INSPECTION COVERAGE (5% weight)
  // Future enhancement: Calculate based on inspection thoroughness
  const coverageRisk = 80 // Conservative default

  // Calculate weighted final risk score
  const finalRisk = Math.round(
    (casesRisk * 0.30) +
    (environmentalRisk * 0.25) +
    (densityRisk * 0.15) +
    (timeRisk * 0.15) +
    (seasonalRisk * 0.10) +
    (coverageRisk * 0.05)
  )

  // Determine inspection frequency based on risk
  let frequency: InspectionRecommendation['frequency']
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let nextInspectionDate: Date
  let daysUntilDue: number

  if (lastInspection) {
    const lastInspectionDate = new Date(lastInspection)
    nextInspectionDate = new Date(lastInspectionDate)
    nextInspectionDate.setDate(nextInspectionDate.getDate() + intervalDays)
    daysUntilDue = Math.ceil((nextInspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  } else {
    // No previous inspection - due immediately
    nextInspectionDate = today
    daysUntilDue = 0
  }

  // Determine status based on timeline
  let status: InspectionRecommendation['status']
  if (daysUntilDue < 0) status = 'OVERDUE'
  else if (daysUntilDue === 0) status = 'DUE_TODAY'
  else if (daysUntilDue <= 2) status = 'DUE_SOON'
  else status = 'ON_TRACK'

  return {
    orchardId: orchard.id,
    orchardName: orchard.orchardName,
    varietyName: orchard.variety.varietyName,
    locationName: orchard.location.locationName,
    riskScore: finalRisk,
    frequency,
    nextInspectionDate: nextInspectionDate.toISOString(),
    daysUntilDue,
    status,
    lastInspection,
    activeCases: activeCases.length,
    riskBreakdown: {
      casesRisk: Math.round(casesRisk),
      environmentalRisk: Math.round(environmentalRisk),
      densityRisk,
      timeRisk,
      seasonalRisk,
      coverageRisk
    }
  }
}