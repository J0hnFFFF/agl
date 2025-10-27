# Memory Service Tests

## Overview

This directory contains comprehensive tests for the Memory Service, including unit tests for individual services and integration tests for API endpoints.

## Test Structure

```
__tests__/
├── setup.ts                    # Global test setup and mocks
├── services/                   # Unit tests for services
│   ├── embedding.service.test.ts
│   ├── qdrant.service.test.ts
│   └── memory.service.test.ts
└── api/                        # Integration tests for API
    └── memory.api.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test embedding.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="search"
```

## Test Coverage

The test suite covers:

### Unit Tests

#### EmbeddingService Tests
- ✅ Embedding generation for single text
- ✅ Batch embedding generation for multiple texts
- ✅ Cosine similarity calculation
- ✅ Error handling for API failures
- ✅ Edge cases (empty text, zero vectors)

#### QdrantService Tests
- ✅ Collection initialization
- ✅ Payload index creation
- ✅ Memory point storage
- ✅ Similarity search with filters
- ✅ Memory deletion
- ✅ Error handling

#### MemoryService Tests
- ✅ Memory retrieval with pagination and filtering
- ✅ Memory creation with importance calculation
- ✅ Semantic similarity search
- ✅ Context retrieval for dialogue (hybrid temporal + semantic)
- ✅ Importance scoring algorithm
- ✅ Memory cleanup
- ✅ Memory statistics
- ✅ Importance decay
- ✅ Error handling and fallbacks

### Integration Tests

#### API Endpoints
- ✅ GET /players/:playerId/memories
- ✅ POST /players/:playerId/memories
- ✅ POST /players/:playerId/memories/search
- ✅ POST /players/:playerId/context
- ✅ PATCH /memories/:memoryId/importance
- ✅ DELETE /players/:playerId/memories/cleanup
- ✅ GET /players/:playerId/memories/stats

## Test Coverage Goals

The project maintains the following coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Mocking Strategy

### External Dependencies

**OpenAI API**: Mocked to avoid real API calls and costs
```typescript
jest.mock('openai');
```

**Qdrant Client**: Mocked to avoid requiring Qdrant instance
```typescript
jest.mock('@qdrant/js-client-rest');
```

**Prisma Client**: Mocked for database operations
```typescript
jest.mock('@prisma/client');
```

### Service Dependencies

Services are mocked when testing higher-level components:
- API tests mock MemoryService
- MemoryService tests mock QdrantService, EmbeddingService, and Prisma

## Key Test Cases

### Importance Scoring Tests

The importance scoring algorithm is thoroughly tested with multiple scenarios:

1. **Base Score**: Default 0.5
2. **Memory Type Boost**: +0.2 for achievement, milestone, first_time, dramatic
3. **Strong Emotion Boost**: +0.15 for amazed, excited, angry, frustrated, grateful
4. **Rarity Boost**: +0.15 for legendary/epic events
5. **MVP Boost**: +0.1 for MVP or legendary status
6. **Streak Boost**: +0.1 for win/loss streak ≥ 5

Example test cases:
- Legendary boss defeat (MVP): 1.0 (capped)
- Regular milestone: 0.7
- Excited emotion: 0.65
- Win streak of 5: 0.6

### Context Retrieval Tests

Tests verify the hybrid retrieval strategy:
- Combines recent important memories (temporal)
- Merges semantically similar memories (vector search)
- Deduplicates overlapping memories
- Sorts by importance and recency

### Error Handling Tests

All services include error handling tests:
- API errors (OpenAI, Qdrant)
- Database errors
- Validation errors
- Graceful degradation (e.g., vector search fails → fallback to DB)

## Writing New Tests

### Unit Test Template

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: jest.Mocked<DependencyType>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDependency = { /* mock methods */ } as any;
    service = new ServiceName(mockDependency);
  });

  describe('methodName', () => {
    it('should perform expected behavior', async () => {
      // Arrange
      mockDependency.method.mockResolvedValue(expectedValue);

      // Act
      const result = await service.methodName(params);

      // Assert
      expect(result).toEqual(expectedValue);
      expect(mockDependency.method).toHaveBeenCalledWith(params);
    });
  });
});
```

### API Test Template

```typescript
describe('API Endpoint', () => {
  let app: Express;
  let mockService: jest.Mocked<ServiceType>;

  beforeEach(() => {
    mockService = { /* mock methods */ } as any;
    app = setupTestApp(mockService);
  });

  it('should handle request', async () => {
    mockService.method.mockResolvedValue(expectedValue);

    const response = await request(app)
      .post('/endpoint')
      .send(requestBody)
      .expect(200);

    expect(response.body).toEqual(expectedValue);
  });
});
```

## Continuous Integration

Tests are run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Deployment pipeline

## Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test file with debug
node --inspect-brk node_modules/.bin/jest --runInBand embedding.service.test.ts

# Use VSCode debugger
# Add breakpoint in test file
# Press F5 to start debugging
```

## Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **Clear Names**: Test names should describe what is being tested
3. **Isolation**: Each test should be independent
4. **Mock External**: Mock all external dependencies
5. **Edge Cases**: Test boundary conditions and error cases
6. **Async/Await**: Use async/await for async tests
7. **Coverage**: Aim for high coverage but focus on meaningful tests

## Future Enhancements

- [ ] E2E tests with real Qdrant instance
- [ ] Performance benchmarking tests
- [ ] Load testing for API endpoints
- [ ] Contract testing for service integrations
- [ ] Mutation testing for robustness
