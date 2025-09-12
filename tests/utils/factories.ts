/**
 * Test Data Factories
 * 
 * These factories provide consistent test data across all test suites.
 * Each factory returns sensible defaults that can be overridden as needed.
 */

import type { InspectionRecommendation } from '@/lib/inspection-service'

// Base test data types
export interface TestUser {
  id: string
  email: string
  token: string
}

export interface TestOrchard {
  id: string
  orchardName: string
  noTreesRow: number
  noTreesColumn: number
  area: number
  userId: string
  varietyId: string
  locationId: string
  variety: TestVariety
  location: TestLocation
  cases?: TestCase[]
  allCases?: TestCase[]
}

export interface TestVariety {
  id: string
  varietyName: string
  varietySusceptability: number
}

export interface TestLocation {
  id: string
  locationName: string
  hemisphere: 'NORTH' | 'SOUTH'
  locationSusceptability: number
}

export interface TestDisease {
  id: string
  name: string
  type: 'DISEASE' | 'PEST'
  severity: number
  spreadability: number
  shortDescription: string
  controlMethod: string
}

export interface TestCase {
  id: string
  diseaseId: string
  orchardId: string
  status: 'ACTIVE' | 'RESOLVED'
  partOfPlant: 'LEAF' | 'STEM' | 'FRUIT'
  createdAt: string
  disease?: TestDisease
  records?: TestRecord[]
}

export interface TestRecord {
  id: string
  caseId: string
  orchardId: string
  recordedAt: string
  numberOfTreesChecked: number
  numberOfTreesInfected: number
}

// Factory functions
export const userFactory = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: 'test-user-123',
  email: 'test@example.com',
  token: 'mock-jwt-token-123',
  ...overrides,
})

export const varietyFactory = (overrides: Partial<TestVariety> = {}): TestVariety => ({
  id: 'test-variety-001',
  varietyName: 'Kensington Pride',
  varietySusceptability: 6,
  ...overrides,
})

export const locationFactory = (overrides: Partial<TestLocation> = {}): TestLocation => ({
  id: 'test-location-001',
  locationName: 'North Queensland',
  hemisphere: 'SOUTH',
  locationSusceptability: 8,
  ...overrides,
})

export const diseaseFactory = (overrides: Partial<TestDisease> = {}): TestDisease => ({
  id: 'test-disease-001',
  name: 'Anthracnose',
  type: 'DISEASE',
  severity: 8,
  spreadability: 7,
  shortDescription: 'A fungal disease causing dark lesions',
  controlMethod: 'Apply copper-based fungicides',
  ...overrides,
})

export const orchardFactory = (overrides: Partial<TestOrchard> = {}): TestOrchard => ({
  id: 'test-orchard-001',
  orchardName: 'Test Orchard',
  noTreesRow: 50,
  noTreesColumn: 20,
  area: 10.5,
  userId: 'test-user-123',
  varietyId: 'test-variety-001',
  locationId: 'test-location-001',
  variety: varietyFactory(),
  location: locationFactory(),
  cases: [],
  allCases: [],
  ...overrides,
})

export const caseFactory = (overrides: Partial<TestCase> = {}): TestCase => ({
  id: 'test-case-001',
  diseaseId: 'test-disease-001',
  orchardId: 'test-orchard-001',
  status: 'ACTIVE',
  partOfPlant: 'LEAF',
  createdAt: new Date().toISOString(),
  disease: diseaseFactory(),
  records: [],
  ...overrides,
})

export const recordFactory = (overrides: Partial<TestRecord> = {}): TestRecord => ({
  id: 'test-record-001',
  caseId: 'test-case-001',
  orchardId: 'test-orchard-001',
  recordedAt: new Date().toISOString(),
  numberOfTreesChecked: 100,
  numberOfTreesInfected: 15,
  ...overrides,
})

// Complex scenario builders
export const highRiskOrchardFactory = (overrides: Partial<TestOrchard> = {}): TestOrchard => {
  const severeDiseases = [
    diseaseFactory({ severity: 9, spreadability: 8, name: 'Severe Anthracnose' }),
    diseaseFactory({ severity: 8, spreadability: 9, name: 'Mango Fruit Fly', type: 'PEST' }),
  ]
  
  const activeCases = severeDiseases.map((disease, index) => 
    caseFactory({
      id: `high-risk-case-${index}`,
      diseaseId: disease.id,
      disease,
      status: 'ACTIVE',
    })
  )

  return orchardFactory({
    orchardName: 'High Risk Orchard',
    variety: varietyFactory({ varietySusceptability: 9 }),
    location: locationFactory({ locationSusceptability: 9 }),
    noTreesRow: 100, // High density
    noTreesColumn: 50,
    area: 5, // Small area = high density
    cases: activeCases,
    allCases: activeCases,
    ...overrides,
  })
}

export const lowRiskOrchardFactory = (overrides: Partial<TestOrchard> = {}): TestOrchard => {
  const mildDisease = diseaseFactory({ severity: 2, spreadability: 3, name: 'Minor Leaf Spot' })
  const resolvedCase = caseFactory({
    diseaseId: mildDisease.id,
    disease: mildDisease,
    status: 'RESOLVED',
  })

  // Recent inspection record
  const recentRecord = recordFactory({
    recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    numberOfTreesChecked: 300,
    numberOfTreesInfected: 5,
  })

  return orchardFactory({
    orchardName: 'Low Risk Orchard',
    variety: varietyFactory({ varietySusceptability: 3 }),
    location: locationFactory({ locationSusceptability: 2 }),
    noTreesRow: 25, // Low density
    noTreesColumn: 15,
    area: 15, // Large area = low density
    cases: [], // No active cases
    allCases: [{
      ...resolvedCase,
      records: [recentRecord],
    }],
    ...overrides,
  })
}

export const orchardWithInspectionHistoryFactory = (daysAgo: number, overrides: Partial<TestOrchard> = {}): TestOrchard => {
  const inspectionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
  
  const record = recordFactory({
    recordedAt: inspectionDate,
    numberOfTreesChecked: 200,
    numberOfTreesInfected: 10,
  })

  const caseWithRecord = caseFactory({
    records: [record],
  })

  return orchardFactory({
    cases: [caseWithRecord],
    allCases: [caseWithRecord],
    ...overrides,
  })
}

// Mock API response builders
export const mockInspectionRecommendation = (overrides: Partial<InspectionRecommendation> = {}): InspectionRecommendation => ({
  orchardId: 'test-orchard-001',
  orchardName: 'Test Orchard',
  varietyName: 'Kensington Pride',
  locationName: 'North Queensland',
  riskScore: 65,
  frequency: 'THREE_DAYS',
  nextInspectionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  daysUntilDue: 3,
  status: 'DUE_SOON',
  activeCases: 1,
  riskBreakdown: {
    casesRisk: 40,
    environmentalRisk: 70,
    densityRisk: 50,
    timeRisk: 60,
    seasonalRisk: 80,
    coverageRisk: 80,
  },
  ...overrides,
})

// Utility functions for date manipulation in tests
export const testUtils = {
  /**
   * Set a fixed date for consistent testing
   */
  setFixedDate: (dateString: string) => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(dateString))
  },

  /**
   * Restore real timers after date testing
   */
  restoreDate: () => {
    jest.useRealTimers()
  },

  /**
   * Create a date N days ago
   */
  daysAgo: (days: number): string => {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  },

  /**
   * Create a date N days from now
   */
  daysFromNow: (days: number): string => {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  },
}