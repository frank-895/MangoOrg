/**
 * Simple Math Utility Tests
 * Tests basic functionality to verify test setup
 */

describe('Basic Math Operations', () => {
  test('addition works correctly', () => {
    expect(2 + 2).toBe(4)
  })

  test('multiplication works correctly', () => {
    expect(3 * 4).toBe(12)
  })

  test('division works correctly', () => {
    expect(10 / 2).toBe(5)
  })
})

describe('Test Utilities', () => {
  test('test environment is set up correctly', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  test('jest matchers work', () => {
    const testObject = { name: 'test', value: 42 }
    
    expect(testObject).toMatchObject({ name: 'test' })
    expect(testObject.value).toBeGreaterThan(40)
    expect(testObject.name).toEqual(expect.any(String))
  })
})