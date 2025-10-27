# AGL CLI Test Suite

Comprehensive test suite for the AGL Command Line Interface tool.

## Test Coverage

### Utility Tests (103 test cases)

#### ConfigManager Tests (`utils/config.test.ts`) - 48 tests
- **Initialization**: Local and global config creation, directory setup
- **Get/Set Operations**: Top-level and nested configuration management
- **Config Merging**: Global and local config precedence
- **Validation**: URL validation, error detection
- **Error Handling**: Corrupted YAML, permission errors

**Key Test Groups:**
- `init()` - 3 tests
- `get()` - 5 tests
- `set()` - 5 tests
- `getMerged()` - 4 tests
- `getAll()` - 3 tests
- `validate()` - 8 tests
- Error handling - 2 tests

#### FileSystemUtils Tests (`utils/fs-utils.test.ts`) - 39 tests
- **Project Name Validation**: npm package name rules, special characters
- **Directory Operations**: Empty directory checks, creation, cleanup
- **File Operations**: File creation, JSON writing, template copying
- **Project Detection**: AGL project identification, root finding
- **Template Rendering**: EJS template processing, binary file handling

**Key Test Groups:**
- `validateProjectName()` - 7 tests
- `isDirectoryEmpty()` - 5 tests
- `ensureEmptyDirectory()` - 4 tests
- `createFile()` - 3 tests
- `writeJSON()` - 2 tests
- `copyTemplate()` - 4 tests
- `findFileUp()` - 3 tests
- `getProjectRoot()` - 2 tests
- `isAGLProject()` - 2 tests
- `getAllFiles()` - 2 tests
- `isTextFile()` - 2 tests

#### Logger Tests (`utils/logger.test.ts`) - 16 tests
- **Log Levels**: Success, error, warn, info, debug
- **Interactive Elements**: Spinners, progress bars, prompts
- **Output Formatting**: Banner, box, table
- **User Input**: Confirmation, selection, text input

**Key Test Groups:**
- Basic logging - 5 tests
- Spinner operations - 5 tests
- Output formatting - 2 tests
- User prompts - 3 tests
- Progress bars - 1 test

### Command Tests (79 test cases)

#### Init Command Tests (`commands/init.test.ts`) - 14 tests
- **Template Generation**: Web, Unity, Unreal project structures
- **File Creation**: Package.json, tsconfig, source files, gitignore
- **Configuration**: AGL config initialization
- **Validation**: Project name validation, overwrite protection
- **Options**: Custom path, skip git, skip install

**Key Test Groups:**
- Web template - 5 tests
- Unity template - 3 tests
- Unreal template - 3 tests
- Configuration - 1 test
- Validation - 2 tests

#### Status Command Tests (`commands/status.test.ts`) - 16 tests
- **Health Checks**: Service availability, response codes
- **Service Detection**: All services, partial failures
- **Endpoint Configuration**: Correct health URLs, custom URLs
- **Verbose Mode**: Response data display, error messages
- **Error Handling**: Timeouts, connection failures

**Key Test Groups:**
- Service status - 4 tests
- Health endpoints - 2 tests
- Verbose mode - 3 tests
- Configuration - 2 tests
- Error handling - 5 tests

#### Config Command Tests (`commands/config.test.ts`) - 12 tests
- **Set Operations**: Local/global config, nested values, validation
- **Get Operations**: Value retrieval, nested access
- **List Operations**: All config display, formatting
- **Scope Management**: Local/global precedence
- **Special Characters**: URLs, spaces, equals signs

**Key Test Groups:**
- Set command - 6 tests
- Get command - 4 tests
- List command - 6 tests
- Help message - 2 tests
- Scope precedence - 4 tests
- Error handling - 2 tests
- Special characters - 3 tests

#### Dev Command Tests (`commands/dev.test.ts`) - 17 tests
- **Project Validation**: AGL project detection
- **Service Management**: Service parsing, selection
- **Docker Mode**: Docker compose integration, environment checks
- **Non-Docker Mode**: Direct service startup
- **Configuration**: Port customization, config loading
- **Graceful Shutdown**: Signal handlers, process cleanup

**Key Test Groups:**
- Project validation - 2 tests
- Service parsing - 2 tests
- Docker mode - 1 test
- Non-Docker mode - 1 test
- Port configuration - 2 tests
- Configuration loading - 2 tests
- Docker Compose - 2 tests
- Environment checks - 3 tests
- Error handling - 2 tests

#### Deploy Command Tests (`commands/deploy.test.ts`) - 20 tests
- **Environment Targets**: Dev, staging, production
- **API Key Validation**: Production requirements
- **Service Selection**: Single, multiple, all services
- **Test Execution**: Test running, failure handling
- **Build Execution**: Build process, error handling
- **Deployment**: Service deployment, progress tracking

**Key Test Groups:**
- Project validation - 1 test
- Environment targets - 4 tests
- API key validation - 2 tests
- Service selection - 3 tests
- Test execution - 4 tests
- Build execution - 3 tests
- Deployment - 2 tests
- Error handling - 2 tests
- Success message - 3 tests

## Test Statistics

```
Total Test Files: 8
Total Test Cases: 182

Utility Tests: 103 (56.6%)
Command Tests: 79 (43.4%)

Coverage Targets:
- Branches: 75%
- Functions: 80%
- Lines: 85%
- Statements: 85%
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in CI mode
```bash
npm run test:ci
```

### Run specific test file
```bash
npm test -- config.test.ts
```

### Run specific test suite
```bash
npm test -- -t "ConfigManager"
```

### Run tests matching pattern
```bash
npm test -- --testPathPattern=commands
```

## Test Structure

```
tests/
├── setup.ts                    # Test environment setup
├── jest.config.js             # Jest configuration
├── utils/                     # Utility tests
│   ├── config.test.ts        # ConfigManager tests (48 tests)
│   ├── fs-utils.test.ts      # FileSystemUtils tests (39 tests)
│   └── logger.test.ts        # Logger tests (16 tests)
└── commands/                  # Command tests
    ├── init.test.ts          # Init command tests (14 tests)
    ├── status.test.ts        # Status command tests (16 tests)
    ├── config.test.ts        # Config command tests (12 tests)
    ├── dev.test.ts           # Dev command tests (17 tests)
    └── deploy.test.ts        # Deploy command tests (20 tests)
```

## Mocking Strategy

### External Dependencies
- **axios**: Mocked for HTTP requests in status command
- **child_process**: Mocked for command execution (exec, spawn)
- **inquirer**: Mocked for user prompts
- **chalk, ora, boxen**: Mocked for output formatting

### Internal Modules
- **Logger**: Fully mocked in command tests to suppress output
- **ConfigManager**: Mocked in integration tests, tested directly in unit tests
- **FileSystemUtils**: Tested with real file operations in temporary directories

## Test Patterns

### Temporary Directory Pattern
```typescript
let testDir: string;

beforeEach(async () => {
  testDir = path.join(os.tmpdir(), `agl-test-${Date.now()}`);
  await fs.ensureDir(testDir);
});

afterEach(async () => {
  await fs.remove(testDir);
});
```

### Process Exit Testing
```typescript
const processExitSpy = jest.spyOn(process, 'exit')
  .mockImplementation((() => {}) as any);

// Run test that should exit

expect(processExitSpy).toHaveBeenCalledWith(1);
processExitSpy.mockRestore();
```

### Async Command Testing
```typescript
await commandFunction(options);

expect(Logger.success).toHaveBeenCalledWith(
  expect.stringContaining('expected message')
);
```

## Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI integration
- Console output - Summary coverage table

## CI Integration

The test suite is designed for CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm run test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Best Practices

1. **Isolation**: Each test runs in isolated temporary directory
2. **Cleanup**: All tests clean up resources in `afterEach`
3. **Mocking**: External dependencies are mocked to avoid side effects
4. **Assertions**: Use specific matchers (toContain, toHaveBeenCalledWith)
5. **Error Testing**: Always restore mocks and spies in error test cases
6. **Descriptive Names**: Test names clearly describe what is being tested
7. **Coverage**: Target 85%+ line coverage, 75%+ branch coverage

## Debugging Tests

### Run single test with verbose output
```bash
DEBUG=true npm test -- -t "specific test name" --verbose
```

### Debug test in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### View failed test output
```bash
npm test -- --verbose --no-coverage
```

## Known Limitations

1. **Process Spawning**: Dev and deploy command tests use simplified mocks for process spawning
2. **Platform Differences**: Some file permission tests may behave differently on Windows
3. **Network Mocking**: Status command tests mock axios rather than actual HTTP servers
4. **Timing**: Tests avoid real delays using mocked setTimeout where possible

## Future Improvements

- [ ] Add E2E tests with real service deployments
- [ ] Add performance benchmarks for file operations
- [ ] Add integration tests with actual Docker
- [ ] Add snapshot testing for generated files
- [ ] Add mutation testing for coverage quality
- [ ] Add visual regression tests for CLI output

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure coverage stays above 85%
3. Add test cases to this README
4. Update test count in statistics
5. Follow existing test patterns
