# AGL Testing Guide

## Overview

The AGL project uses comprehensive testing at multiple levels to ensure code quality, reliability, and maintainability. This document describes the testing strategy, how to run tests, and how to write new tests.

## Testing Strategy

### Test Pyramid

```
        ┌─────────────────┐
        │   E2E Tests     │  ← Small number, high confidence
        │  (Integration)  │
        ├─────────────────┤
        │  Unit Tests     │  ← Large number, fast execution
        │   (Services)    │
        └─────────────────┘
```

### Coverage Goals

- **Unit Tests**: > 80% code coverage
- **Integration Tests**: All API endpoints covered
- **Service Tests**: All major user flows covered

## Test Organization

```
agl/
├── services/
│   ├── api-service/
│   │   ├── src/
│   │   │   ├── game/
│   │   │   │   └── game.service.spec.ts     # Unit tests
│   │   │   └── player/
│   │   │       └── player.service.spec.ts   # Unit tests
│   │   └── test/
│   │       ├── game.e2e-spec.ts             # Integration tests
│   │       └── player.e2e-spec.ts           # Integration tests
│   ├── emotion-service/
│   │   └── test_main.py                     # Unit + integration tests
│   └── dialogue-service/
│       └── test_main.py                     # Unit + integration tests
```

## Running Tests

### API Service (NestJS)

#### All Tests

```bash
cd services/api-service
npm test
```

#### Unit Tests Only

```bash
npm test -- game.service.spec
npm test -- player.service.spec
```

#### Integration Tests (E2E)

```bash
npm run test:e2e
```

#### With Coverage

```bash
npm run test:cov
```

#### Watch Mode

```bash
npm run test:watch
```

### Emotion Service (Python)

#### All Tests

```bash
cd services/emotion-service
pytest
```

#### Specific Test File

```bash
pytest test_main.py
```

#### With Coverage

```bash
pytest --cov=. --cov-report=html
```

#### Verbose Output

```bash
pytest -v
```

#### Specific Test Class

```bash
pytest test_main.py::TestEmotionAnalysis
```

#### Specific Test Method

```bash
pytest test_main.py::TestEmotionAnalysis::test_analyze_player_victory
```

### Dialogue Service (Python)

#### All Tests

```bash
cd services/dialogue-service
pytest
```

#### With Coverage

```bash
pytest --cov=. --cov-report=html
```

#### Verbose Output

```bash
pytest -v
```

## Test Types

### 1. Unit Tests

**Purpose**: Test individual functions/methods in isolation

**Characteristics**:
- Fast execution (< 1ms per test)
- No external dependencies (database, network, etc.)
- Use mocks/stubs for dependencies
- High coverage of edge cases

**Example**: `game.service.spec.ts`

```typescript
describe('GameService', () => {
  let service: GameService;
  let mockPrisma: MockPrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should return game when found', async () => {
    mockPrisma.game.findUnique.mockResolvedValue(mockGame);

    const result = await service.findOne('game-1');

    expect(result).toEqual(expectedGame);
  });
});
```

**Python Example**: `test_main.py`

```python
def test_get_base_emotion():
    result = _get_base_emotion("player.victory", {})
    assert result["emotion"] == "happy"
    assert result["intensity"] == 0.9
```

### 2. Integration Tests (E2E)

**Purpose**: Test complete user flows through the API

**Characteristics**:
- Test real HTTP endpoints
- Use real database (test database)
- Test request/response cycles
- Verify data persistence

**Example**: `game.e2e-spec.ts`

```typescript
describe('Game API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Setup test app and database
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  it('should create a new game', async () => {
    const response = await request(app.getHttpServer())
      .post('/games')
      .send({
        clientId: testClientId,
        name: 'Test Game',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Game');
  });
});
```

**Python Example**: Testing FastAPI endpoints

```python
from fastapi.testclient import TestClient

def test_analyze_endpoint():
    response = client.post(
        "/analyze",
        json={"type": "player.victory", "data": {}, "context": {}}
    )
    assert response.status_code == 200
    assert response.json()["emotion"] == "happy"
```

## Writing Tests

### Unit Test Best Practices

#### 1. Test Structure (AAA Pattern)

```typescript
it('should calculate stats correctly', async () => {
  // Arrange - Setup test data and mocks
  const mockGame = { id: 'game-1', _count: { players: 1500 } };
  mockPrisma.game.findUnique.mockResolvedValue(mockGame);
  mockPrisma.player.count.mockResolvedValue(320);

  // Act - Execute the code under test
  const result = await service.findOne('game-1');

  // Assert - Verify the results
  expect(result.stats.totalPlayers).toBe(1500);
  expect(result.stats.activePlayersToday).toBe(320);
});
```

#### 2. Test Naming

Use descriptive names that explain the scenario:

**Good**:
```typescript
it('should return null when game is inactive')
it('should cap limit at 100 for pagination')
it('should boost intensity for MVP status')
```

**Bad**:
```typescript
it('test1')
it('should work')
it('game test')
```

#### 3. Test One Thing

Each test should verify a single behavior:

**Good**:
```typescript
it('should update game name', async () => {
  const result = await service.update('game-1', { name: 'New Name' });
  expect(result.name).toBe('New Name');
});

it('should update game description', async () => {
  const result = await service.update('game-1', { description: 'New Desc' });
  expect(result.description).toBe('New Desc');
});
```

**Bad**:
```typescript
it('should update everything', async () => {
  // Tests name, description, config, and error handling all at once
});
```

#### 4. Mock External Dependencies

Always mock external services:

```typescript
const mockPrismaService = {
  game: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  player: {
    count: jest.fn(),
  },
};
```

#### 5. Clean Up After Each Test

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Clear all mock call history
});
```

### Integration Test Best Practices

#### 1. Database Setup and Teardown

```typescript
beforeAll(async () => {
  // Create test data
  const client = await prisma.client.create({
    data: { name: 'Test Client', email: 'test@test.com' }
  });
  testClientId = client.id;
});

afterAll(async () => {
  // Clean up test data
  await prisma.client.delete({ where: { id: testClientId } });
  await app.close();
});
```

#### 2. Test Real Endpoints

```typescript
const response = await request(app.getHttpServer())
  .post('/games')
  .send({ clientId, name: 'Test Game' })
  .expect(201);
```

#### 3. Verify Persistence

```typescript
// Create via API
const response = await request(app.getHttpServer())
  .post('/games')
  .send({ name: 'Test' })
  .expect(201);

// Verify in database
const game = await prisma.game.findUnique({
  where: { id: response.body.id }
});
expect(game).not.toBeNull();
expect(game.name).toBe('Test');
```

#### 4. Test Error Cases

```typescript
it('should return 404 for non-existent game', async () => {
  await request(app.getHttpServer())
    .get('/games/non-existent-id')
    .expect(404);
});
```

## Test Coverage

### Viewing Coverage

#### NestJS/TypeScript

```bash
cd services/api-service
npm run test:cov
```

Coverage report is generated in `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser.

#### Python

```bash
cd services/emotion-service
pytest --cov=. --cov-report=html
```

Coverage report is generated in `htmlcov/` directory. Open `htmlcov/index.html` in a browser.

### Coverage Metrics

- **Lines**: Percentage of lines executed
- **Branches**: Percentage of conditional branches taken
- **Functions**: Percentage of functions called
- **Statements**: Percentage of statements executed

### Target Coverage

| Service | Target | Current |
|---------|--------|---------|
| API Service | > 80% | TBD |
| Emotion Service | > 85% | TBD |
| Dialogue Service | > 85% | TBD |

## Test Scenarios

### Game Service Tests

**Unit Tests** (`game.service.spec.ts`):
- ✓ Find all active games
- ✓ Find one game with stats
- ✓ Return null for inactive games
- ✓ Create game with all fields
- ✓ Create game with minimal fields
- ✓ Update game fields
- ✓ Handle update errors
- ✓ Soft delete game
- ✓ Handle delete errors

**Integration Tests** (`game.e2e-spec.ts`):
- ✓ POST /games - Create game
- ✓ GET /games - List active games
- ✓ GET /games/:id - Get game details
- ✓ PATCH /games/:id - Update game
- ✓ DELETE /games/:id - Soft delete game
- ✓ Error handling (404, validation)

### Player Service Tests

**Unit Tests** (`player.service.spec.ts`):
- ✓ Find all players with pagination
- ✓ Respect pagination limits
- ✓ Create or get existing player
- ✓ Use default persona
- ✓ Find player with memories
- ✓ Update player preferences
- ✓ Handle errors

**Integration Tests** (`player.e2e-spec.ts`):
- ✓ POST /games/:gameId/players - Create player
- ✓ GET /games/:gameId/players - List players
- ✓ GET /players/:playerId - Get player details
- ✓ PATCH /players/:playerId - Update player
- ✓ Pagination and sorting
- ✓ Cross-game isolation

### Emotion Service Tests

**Unit Tests** (`test_main.py`):
- ✓ Base emotion detection for all event types
- ✓ Context-aware intensity adjustments
- ✓ Health-based adjustments
- ✓ Streak-based adjustments
- ✓ Difficulty-based adjustments
- ✓ MVP status handling
- ✓ Action mapping
- ✓ Edge cases

**Integration Tests**:
- ✓ POST /analyze endpoint
- ✓ Complex event scenarios
- ✓ Multi-factor context stacking
- ✓ Unknown event handling

### Dialogue Service Tests

**Unit Tests** (`test_main.py`):
- ✓ Template exact matching
- ✓ Persona consistency
- ✓ Fallback mechanisms (4 tiers)
- ✓ Template library coverage
- ✓ Emotion-persona fallbacks
- ✓ Variant randomness

**Integration Tests**:
- ✓ POST /generate endpoint
- ✓ All persona types
- ✓ Event-emotion combinations
- ✓ Zero cost verification

## Continuous Integration

### Running Tests in CI

```yaml
# .github/workflows/test.yml (example)
name: Tests

on: [push, pull_request]

jobs:
  api-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd services/api-service && npm install
      - run: cd services/api-service && npm test
      - run: cd services/api-service && npm run test:e2e

  emotion-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: cd services/emotion-service && pip install -r requirements.txt
      - run: cd services/emotion-service && pytest

  dialogue-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: cd services/dialogue-service && pip install -r requirements.txt
      - run: cd services/dialogue-service && pytest
```

## Debugging Tests

### NestJS/TypeScript

#### Debug Single Test

```bash
npm run test:debug -- game.service.spec
```

Then attach debugger in VS Code:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Jest",
  "port": 9229,
  "skipFiles": ["<node_internals>/**"]
}
```

#### Add Breakpoints

```typescript
it('should do something', async () => {
  debugger; // Execution will pause here
  const result = await service.method();
  expect(result).toBe(expected);
});
```

### Python

#### Debug with pytest

```bash
pytest --pdb  # Drop into debugger on failure
pytest -s     # Show print statements
```

#### Add Breakpoints

```python
def test_something():
    import pdb; pdb.set_trace()  # Execution will pause here
    result = function_to_test()
    assert result == expected
```

## Common Issues and Solutions

### Issue: Tests Pass Locally but Fail in CI

**Causes**:
- Different Node.js/Python versions
- Missing environment variables
- Database state differences
- Timing issues

**Solutions**:
- Use same versions in CI as local (.nvmrc, requirements.txt)
- Mock time-dependent code
- Ensure clean database state before each test

### Issue: Flaky Tests

**Causes**:
- Race conditions
- Shared state between tests
- External service dependencies

**Solutions**:
- Avoid shared mutable state
- Use beforeEach/afterEach properly
- Mock external services
- Add proper async/await

### Issue: Slow Tests

**Causes**:
- Too many database calls
- Not using mocks
- Large test data

**Solutions**:
- Use mocks for unit tests
- Optimize database queries
- Use smaller test data sets
- Run tests in parallel

## Test Maintenance

### When to Update Tests

- ✓ When adding new features
- ✓ When fixing bugs (add regression test)
- ✓ When refactoring code
- ✓ When API contracts change
- ✓ When discovering edge cases

### Test Review Checklist

- [ ] Test names are descriptive
- [ ] Tests are independent (no shared state)
- [ ] Mocks are used for external dependencies
- [ ] Edge cases are covered
- [ ] Error cases are tested
- [ ] Tests are fast (< 100ms for unit tests)
- [ ] No console.log/print statements
- [ ] Coverage meets targets

## Resources

### NestJS Testing

- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

### Python Testing

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing Guide](https://fastapi.tiangolo.com/tutorial/testing/)

### Testing Best Practices

- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Support

For questions about testing:
- Technical issues: Create an issue in the project repository
- Testing strategy: Contact the development team
- CI/CD: Contact DevOps team
