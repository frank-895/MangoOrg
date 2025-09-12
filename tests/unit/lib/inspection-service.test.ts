/**
 * Unit Tests for Inspection Service
 * 
 * Tests the core AI-powered risk assessment algorithm in isolation.
 * Focuses on business logic without database dependencies.
 */

import { calculateUserInspectionRecommendations, calculateUpcomingInspections } from '@/lib/inspection-service'
import { 
  orchardFactory, 
  highRiskOrchardFactory, 
  lowRiskOrchardFactory,
  orchardWithInspectionHistoryFactory,
  testUtils,
} from '../../utils/factories'

// Mock Prisma for unit tests - we'll test with real DB in integration tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    orchard: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    case: {
      findMany: jest.fn(),
    },
  },
}))

const { prisma } = require('@/lib/prisma')

describe('Inspection Service - Risk Calculation Algorithm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    testUtils.restoreDate()
  })

  describe('Risk Factor Calculations', () => {
    test('calculates high risk for orchards with severe active cases', async () => {
      // Set fixed date for consistent seasonal calculations
      testUtils.setFixedDate('2024-10-15') // Spring in Southern Hemisphere

      const userId = 'test-user-123'
      const highRiskOrchards = [highRiskOrchardFactory({ userId })]
      
      // Mock Prisma responses
      prisma.orchard.findMany.mockResolvedValue(highRiskOrchards)
      prisma.case.findMany.mockResolvedValue(highRiskOrchards[0].cases)

      const recommendations = await calculateUserInspectionRecommendations(userId)

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0]).toMatchObject({
        orchardId: highRiskOrchards[0].id,
        orchardName: 'High Risk Orchard',
        frequency: 'DAILY', // Should recommend daily for high risk
        status: expect.stringMatching(/OVERDUE|DUE_TODAY|DUE_SOON/),
      })

      // Risk score should be high due to severe diseases
      expect(recommendations[0].riskScore).toBeGreaterThanOrEqual(70)
      expect(recommendations[0].riskBreakdown.casesRisk).toBeGreaterThan(80)
      expect(recommendations[0].riskBreakdown.seasonalRisk).toBe(90) // Spring in South
    })

    test('calculates low risk for orchards with no active cases and recent inspections', async () => {
      testUtils.setFixedDate('2024-07-15') // Winter in Southern Hemisphere

      const userId = 'test-user-123'
      const lowRiskOrchards = [lowRiskOrchardFactory({ userId })]
      
      prisma.orchard.findMany.mockResolvedValue(lowRiskOrchards)
      prisma.case.findMany.mockResolvedValue(lowRiskOrchards[0].allCases)

      const recommendations = await calculateUserInspectionRecommendations(userId)

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0]).toMatchObject({
        frequency: 'WEEKLY', // Should recommend weekly for low risk
        status: 'ON_TRACK',
      })

      // Risk score should be low
      expect(recommendations[0].riskScore).toBeLessThan(40)
      expect(recommendations[0].riskBreakdown.casesRisk).toBe(0) // No active cases
      expect(recommendations[0].riskBreakdown.seasonalRisk).toBe(20) // Winter low risk
    })

    test('increases risk based on time since last inspection', async () => {
      const userId = 'test-user-123'
      
      // Test different time gaps
      const scenarios = [
        { daysAgo: 1, expectedTimeRisk: 20 },   // Recent inspection
        { daysAgo: 5, expectedTimeRisk: 60 },   // Moderate gap
        { daysAgo: 20, expectedTimeRisk: 100 }, // Long gap
      ]

      for (const { daysAgo, expectedTimeRisk } of scenarios) {
        const orchard = orchardWithInspectionHistoryFactory(daysAgo, { userId })
        
        prisma.orchard.findMany.mockResolvedValue([orchard])
        prisma.case.findMany.mockResolvedValue(orchard.allCases)

        const recommendations = await calculateUserInspectionRecommendations(userId)

        expect(recommendations[0].riskBreakdown.timeRisk).toBe(expectedTimeRisk)
      }
    })

    test('adjusts seasonal risk based on hemisphere and month', async () => {
      const userId = 'test-user-123'
      
      const scenarios = [
        // Northern Hemisphere
        { hemisphere: 'NORTH' as const, month: '2024-04-15', expectedRisk: 90 }, // Spring
        { hemisphere: 'NORTH' as const, month: '2024-07-15', expectedRisk: 80 }, // Summer  
        { hemisphere: 'NORTH' as const, month: '2024-01-15', expectedRisk: 20 }, // Winter
        
        // Southern Hemisphere (seasons flipped)
        { hemisphere: 'SOUTH' as const, month: '2024-10-15', expectedRisk: 90 }, // Spring
        { hemisphere: 'SOUTH' as const, month: '2024-01-15', expectedRisk: 80 }, // Summer
        { hemisphere: 'SOUTH' as const, month: '2024-07-15', expectedRisk: 20 }, // Winter
      ]

      for (const { hemisphere, month, expectedRisk } of scenarios) {
        testUtils.setFixedDate(month)

        const orchard = orchardFactory({
          userId,
          location: { 
            id: 'test-loc',
            locationName: 'Test',
            hemisphere,
            locationSusceptability: 5
          }
        })
        
        prisma.orchard.findMany.mockResolvedValue([orchard])
        prisma.case.findMany.mockResolvedValue([])

        const recommendations = await calculateUserInspectionRecommendations(userId)

        expect(recommendations[0].riskBreakdown.seasonalRisk).toBe(expectedRisk)
        
        testUtils.restoreDate()
      }
    })

    test('calculates density risk based on trees per hectare', async () => {
      const userId = 'test-user-123'
      
      const scenarios = [
        // High density: > 800 trees/ha
        { rows: 100, columns: 50, area: 5, expectedRisk: 100 }, // 1000 trees/ha
        
        // Medium density: 400-800 trees/ha  
        { rows: 50, columns: 20, area: 1.5, expectedRisk: 50 }, // 667 trees/ha
        
        // Low density: < 400 trees/ha
        { rows: 25, columns: 15, area: 2, expectedRisk: 20 }, // 188 trees/ha
      ]

      for (const { rows, columns, area, expectedRisk } of scenarios) {
        const orchard = orchardFactory({
          userId,
          noTreesRow: rows,
          noTreesColumn: columns,
          area,
        })
        
        prisma.orchard.findMany.mockResolvedValue([orchard])
        prisma.case.findMany.mockResolvedValue([])

        const recommendations = await calculateUserInspectionRecommendations(userId)

        expect(recommendations[0].riskBreakdown.densityRisk).toBe(expectedRisk)
      }
    })
  })

  describe('Frequency Mapping', () => {
    test('maps risk scores to correct inspection frequencies', async () => {
      const userId = 'test-user-123'

      const scenarios = [
        { riskScore: 85, expectedFrequency: 'DAILY' as const },
        { riskScore: 55, expectedFrequency: 'THREE_DAYS' as const },
        { riskScore: 25, expectedFrequency: 'WEEKLY' as const },
      ]

      // We'll create scenarios that produce specific risk scores
      for (const { expectedFrequency } of scenarios) {
        let orchard
        
        if (expectedFrequency === 'DAILY') {
          orchard = highRiskOrchardFactory({ userId })
        } else if (expectedFrequency === 'THREE_DAYS') {
          orchard = orchardFactory({
            userId,
            variety: { id: 'test', varietyName: 'Medium', varietySusceptability: 6 },
            location: { id: 'test', locationName: 'Medium', hemisphere: 'SOUTH', locationSusceptability: 6 },
            cases: []
          })
        } else {
          orchard = lowRiskOrchardFactory({ userId })
        }
        
        prisma.orchard.findMany.mockResolvedValue([orchard])
        prisma.case.findMany.mockResolvedValue(orchard.allCases || [])

        const recommendations = await calculateUserInspectionRecommendations(userId)

        expect(recommendations[0].frequency).toBe(expectedFrequency)
      }
    })
  })

  describe('Status Determination', () => {
    test('determines correct status based on days until due', async () => {
      const userId = 'test-user-123'
      testUtils.setFixedDate('2024-10-15')

      // Test one specific scenario to avoid complex date mocking
      const orchard = lowRiskOrchardFactory({ userId })
      
      prisma.orchard.findMany.mockResolvedValue([orchard])
      prisma.case.findMany.mockResolvedValue(orchard.allCases || [])

      const recommendations = await calculateUserInspectionRecommendations(userId)

      // Low risk orchard should be ON_TRACK due to recent inspection
      expect(recommendations[0].status).toMatch(/ON_TRACK|DUE_SOON/)
    })
  })

  describe('Upcoming Inspections', () => {
    test('sorts upcoming inspections by urgency', async () => {
      const userId = 'test-user-123'
      testUtils.setFixedDate('2024-10-15')

      const orchards = [
        orchardWithInspectionHistoryFactory(10, { 
          userId, 
          id: 'overdue', 
          orchardName: 'Overdue Orchard' 
        }),
        orchardWithInspectionHistoryFactory(2, { 
          userId, 
          id: 'on-track', 
          orchardName: 'On Track Orchard' 
        }),
        orchardWithInspectionHistoryFactory(7, { 
          userId, 
          id: 'due-today', 
          orchardName: 'Due Today Orchard' 
        }),
      ]

      prisma.orchard.findMany.mockResolvedValue(orchards)
      
      // Mock individual orchard calls
      for (const orchard of orchards) {
        prisma.case.findMany
          .mockResolvedValueOnce(orchard.allCases || [])
      }

      const upcomingInspections = await calculateUpcomingInspections(userId)

      // Should be sorted: OVERDUE, DUE_TODAY, then by days until due
      expect(upcomingInspections[0].orchardName).toBe('Overdue Orchard')
      expect(upcomingInspections[0].status).toBe('OVERDUE')
    })
  })

  describe('Error Handling', () => {
    test('handles missing orchard gracefully', async () => {
      prisma.orchard.findMany.mockResolvedValue([])

      const result = await calculateUserInspectionRecommendations('non-existent-user')

      expect(result).toEqual([])
    })

    test('handles database errors gracefully', async () => {
      // Suppress console.error for this specific test
      const originalError = console.error
      console.error = jest.fn()

      prisma.orchard.findMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(calculateUserInspectionRecommendations('test-user'))
        .rejects
        .toThrow('Database connection failed')

      // Restore console.error
      console.error = originalError
    })
  })
})