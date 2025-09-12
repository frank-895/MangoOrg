# 🧪 MangoOrg Test Suite

Comprehensive testing for the MangoOrg mango disease management system.

## 🚀 Quick Start

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit          # Unit tests only (~1 second)

# Development
npm run test:watch         # Watch mode for unit tests
npm run test:coverage      # Generate coverage report

# CI/CD
npm run test:ci            # Optimized for CI environments
```

## 📋 Test Structure

```
tests/
├── unit/           # Fast, isolated unit tests
├── e2e/           # End-to-end user journey tests (future)
└── utils/         # Shared test utilities and factories
```

## 🎯 Coverage Goals

- **Business Logic**: 80% (inspection algorithm and core services)
- **Current Coverage**: 84% statements, 82% functions, 84% lines ✅

## 🏗️ Writing Tests

### Unit Tests
```typescript
import { myFunction } from '@/lib/my-service'
import { orchardFactory } from '../../utils/factories'

test('calculates correctly', () => {
  const orchard = orchardFactory({ area: 10 })
  const result = myFunction(orchard)
  expect(result).toBe(expectedValue)
})
```


### Using Test Factories
```typescript
import { orchardFactory, highRiskOrchardFactory } from '../utils/factories'

// Basic orchard with defaults
const orchard = orchardFactory()

// High-risk scenario
const dangerousOrchard = highRiskOrchardFactory({ 
  userId: 'test-user',
  area: 5 
})
```

## 🚦 CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main`

**Performance Targets:**
- Unit Tests: < 1 second ✅
- Total CI Time: < 2 minutes ✅

## 🐛 Common Issues

```bash
# Database connection issues
npm run db:migrate

# Clear Jest cache
npx jest --clearCache

# Run single test with debugging
npx jest --verbose tests/path/to/test.ts
```

## 📚 Best Practices

- **One concept per test**: Each test should verify one specific behavior
- **Use factories**: Don't hardcode test data
- **Isolated tests**: Each test should be independent
- **Descriptive names**: Test names should explain what they verify