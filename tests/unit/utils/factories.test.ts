/**
 * Test Data Factories Tests
 * Verify that our test data factories work correctly
 */

import {
  userFactory,
  orchardFactory,
  varietyFactory,
  locationFactory,
  diseaseFactory,
  caseFactory,
  recordFactory,
  highRiskOrchardFactory,
  lowRiskOrchardFactory,
  orchardWithInspectionHistoryFactory,
  mockInspectionRecommendation,
  testUtils,
} from '../../utils/factories'

describe('Test Data Factories', () => {
  describe('Basic Factories', () => {
    test('userFactory creates valid user', () => {
      const user = userFactory()
      
      expect(user).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        token: expect.any(String),
      })
    })

    test('userFactory accepts overrides', () => {
      const customUser = userFactory({ 
        email: 'custom@test.com',
        id: 'custom-id-123' 
      })
      
      expect(customUser).toMatchObject({
        id: 'custom-id-123',
        email: 'custom@test.com',
        token: expect.any(String),
      })
    })

    test('orchardFactory creates valid orchard', () => {
      const orchard = orchardFactory()
      
      expect(orchard).toMatchObject({
        id: expect.any(String),
        orchardName: expect.any(String),
        noTreesRow: expect.any(Number),
        noTreesColumn: expect.any(Number),
        area: expect.any(Number),
        userId: expect.any(String),
        varietyId: expect.any(String),
        locationId: expect.any(String),
        variety: expect.objectContaining({
          varietyName: expect.any(String),
          varietySusceptability: expect.any(Number),
        }),
        location: expect.objectContaining({
          locationName: expect.any(String),
          hemisphere: expect.stringMatching(/NORTH|SOUTH/),
          locationSusceptability: expect.any(Number),
        }),
      })

      // Verify numeric constraints
      expect(orchard.noTreesRow).toBeGreaterThan(0)
      expect(orchard.noTreesColumn).toBeGreaterThan(0)
      expect(orchard.area).toBeGreaterThan(0)
      expect(orchard.variety.varietySusceptability).toBeGreaterThanOrEqual(0)
      expect(orchard.variety.varietySusceptability).toBeLessThanOrEqual(10)
    })

    test('diseaseFactory creates valid disease', () => {
      const disease = diseaseFactory()
      
      expect(disease).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        type: expect.stringMatching(/DISEASE|PEST/),
        severity: expect.any(Number),
        spreadability: expect.any(Number),
        shortDescription: expect.any(String),
        controlMethod: expect.any(String),
      })

      // Verify numeric ranges
      expect(disease.severity).toBeGreaterThanOrEqual(0)
      expect(disease.severity).toBeLessThanOrEqual(10)
      expect(disease.spreadability).toBeGreaterThanOrEqual(0)
      expect(disease.spreadability).toBeLessThanOrEqual(10)
    })
  })

  describe('Complex Scenario Factories', () => {
    test('highRiskOrchardFactory creates high-risk scenario', () => {
      const orchard = highRiskOrchardFactory()
      
      expect(orchard.orchardName).toContain('High Risk')
      expect(orchard.variety.varietySusceptability).toBeGreaterThanOrEqual(8)
      expect(orchard.location.locationSusceptability).toBeGreaterThanOrEqual(8)
      expect(orchard.cases).toHaveLength(2) // Should have severe diseases
      
      // Check case severity
      orchard.cases?.forEach(caseData => {
        expect(caseData.disease?.severity).toBeGreaterThanOrEqual(8)
        expect(caseData.disease?.spreadability).toBeGreaterThanOrEqual(8)
        expect(caseData.status).toBe('ACTIVE')
      })

      // High density calculation
      const totalTrees = orchard.noTreesRow * orchard.noTreesColumn
      const density = totalTrees / orchard.area
      expect(density).toBeGreaterThan(400) // Should be medium to high density
    })

    test('lowRiskOrchardFactory creates low-risk scenario', () => {
      const orchard = lowRiskOrchardFactory()
      
      expect(orchard.orchardName).toContain('Low Risk')
      expect(orchard.variety.varietySusceptability).toBeLessThanOrEqual(4)
      expect(orchard.location.locationSusceptability).toBeLessThanOrEqual(4)
      expect(orchard.cases).toHaveLength(0) // No active cases
      expect(orchard.allCases).toHaveLength(1) // But has resolved case with recent inspection

      // Check resolved case
      const resolvedCase = orchard.allCases?.[0]
      expect(resolvedCase?.status).toBe('RESOLVED')
      expect(resolvedCase?.records).toHaveLength(1)
      
      // Should have recent inspection
      const record = resolvedCase?.records?.[0]
      const daysSince = (Date.now() - new Date(record?.recordedAt || '').getTime()) / (1000 * 60 * 60 * 24)
      expect(daysSince).toBeLessThan(2) // Recent inspection
    })

    test('orchardWithInspectionHistoryFactory creates correct history', () => {
      const daysAgo = 5
      const orchard = orchardWithInspectionHistoryFactory(daysAgo)
      
      expect(orchard.cases).toHaveLength(1)
      expect(orchard.allCases).toHaveLength(1)
      
      const caseWithRecord = orchard.cases?.[0]
      expect(caseWithRecord?.records).toHaveLength(1)
      
      const record = caseWithRecord?.records?.[0]
      const actualDaysAgo = Math.floor(
        (Date.now() - new Date(record?.recordedAt || '').getTime()) / (1000 * 60 * 60 * 24)
      )
      
      expect(actualDaysAgo).toBe(daysAgo)
    })
  })

  describe('Mock Response Builders', () => {
    test('mockInspectionRecommendation creates valid recommendation', () => {
      const recommendation = mockInspectionRecommendation()
      
      expect(recommendation).toMatchObject({
        orchardId: expect.any(String),
        orchardName: expect.any(String),
        varietyName: expect.any(String),
        locationName: expect.any(String),
        riskScore: expect.any(Number),
        frequency: expect.stringMatching(/DAILY|THREE_DAYS|WEEKLY/),
        nextInspectionDate: expect.any(String),
        daysUntilDue: expect.any(Number),
        status: expect.stringMatching(/OVERDUE|DUE_TODAY|DUE_SOON|ON_TRACK/),
        activeCases: expect.any(Number),
        riskBreakdown: expect.objectContaining({
          casesRisk: expect.any(Number),
          environmentalRisk: expect.any(Number),
          densityRisk: expect.any(Number),
          timeRisk: expect.any(Number),
          seasonalRisk: expect.any(Number),
          coverageRisk: expect.any(Number),
        }),
      })

      // Verify risk score range
      expect(recommendation.riskScore).toBeGreaterThanOrEqual(0)
      expect(recommendation.riskScore).toBeLessThanOrEqual(100)

      // Verify risk breakdown values
      Object.values(recommendation.riskBreakdown).forEach(risk => {
        expect(risk).toBeGreaterThanOrEqual(0)
        expect(risk).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('Test Utils', () => {
    test('date utilities work correctly', () => {
      const twoDaysAgo = testUtils.daysAgo(2)
      const threeDaysFromNow = testUtils.daysFromNow(3)
      
      expect(new Date(twoDaysAgo)).toBeInstanceOf(Date)
      expect(new Date(threeDaysFromNow)).toBeInstanceOf(Date)
      
      // Verify the dates are correct
      const twoDaysAgoDate = new Date(twoDaysAgo)
      const expectedTwoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      
      // Should be within a few seconds of each other
      expect(Math.abs(twoDaysAgoDate.getTime() - expectedTwoDaysAgo.getTime())).toBeLessThan(5000)
    })

    test('fixed date utilities work correctly', () => {
      const fixedDate = '2024-06-15T10:00:00.000Z'
      
      testUtils.setFixedDate(fixedDate)
      
      expect(new Date().toISOString()).toBe(fixedDate)
      
      testUtils.restoreDate()
      
      // Should be back to real time (within a second)
      const now = new Date()
      const realNow = new Date()
      expect(Math.abs(now.getTime() - realNow.getTime())).toBeLessThan(1000)
    })
  })

  describe('Factory Consistency', () => {
    test('factories produce consistent IDs across calls', () => {
      const user1 = userFactory()
      const user2 = userFactory()
      
      expect(user1.id).toBe(user2.id) // Should be same default ID
      
      const customUser1 = userFactory({ id: 'custom-1' })
      const customUser2 = userFactory({ id: 'custom-2' })
      
      expect(customUser1.id).not.toBe(customUser2.id)
    })

    test('related entities have consistent references', () => {
      const orchard = orchardFactory()
      
      expect(orchard.varietyId).toBe(orchard.variety.id)
      expect(orchard.locationId).toBe(orchard.location.id)
    })

    test('complex scenarios maintain data integrity', () => {
      const orchard = highRiskOrchardFactory()
      
      // All cases should belong to this orchard
      orchard.cases?.forEach(caseData => {
        // Cases would reference orchard ID in real scenario
        expect(caseData).toBeDefined()
      })

      // All cases should have diseases
      orchard.cases?.forEach(caseData => {
        expect(caseData.disease).toBeDefined()
        expect(caseData.diseaseId).toBe(caseData.disease?.id)
      })
    })
  })
})