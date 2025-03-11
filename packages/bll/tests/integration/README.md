# BLL Integration Tests

This directory contains integration tests for the Business Logic Layer (BLL) services. These tests follow Domain-Driven Design principles and test the actual business logic with real database interactions.

## Testing Approach

Integration tests in this directory follow these key patterns:

1. **Transaction-Based Testing**
   - All tests run within database transactions
   - Automatic rollback ensures test isolation
   - No test data persists between test runs

2. **Real Repository Usage**
   - Tests use actual repositories (not mocks)
   - Database interactions are real but isolated
   - Tests verify proper error translation from DB to domain layer

3. **Service Factory Pattern**
   - Services are created through factory functions
   - Dependencies are injected following DI principles
   - Repositories are transaction-aware

## Directory Structure

Tests are organized by domain to match the source code structure:

```
integration/
├── domains/
│   ├── users/
│   │   └── user-service.integration.test.ts
│   └── [other-domains]/
└── README.md
```

## Running Tests

To run all integration tests:

```bash
npm run test:integration
```

To run tests for a specific domain:

```bash
npm run test:integration -- domains/users
```

## Test Utilities

Integration tests use the utilities from `packages/bll/tests/test-utils.ts`:

- `executeServiceTest`: Runs a test within a transaction and provides service context
- `withServiceTest`: Helper for testing a specific service in isolation
- `ServiceTestContext`: Provides access to repositories and services

## Best Practices

1. Each test should be completely isolated
2. Use `executeServiceTest` to ensure transaction rollback
3. Create test data within each test (don't rely on existing data)
4. Test both success and error paths
5. Verify domain-specific errors (EntityNotFoundError, DuplicateEntityError, etc.)
