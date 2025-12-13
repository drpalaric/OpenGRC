# Testing Strategy - Intended Functionality Only

This document outlines our test-driven development approach focused on ensuring the system **does what it's supposed to do, and ONLY what it's supposed to do**.

## Philosophy

Our tests verify:
1. ✅ **What SHOULD happen** - Core CRUD functionality works
2. ✅ **What should NOT happen** - No unintended features or side effects
3. ✅ **Intended behavior** - System behaves exactly as designed

## Test Coverage

### Unit Tests (`*.spec.ts`)

**Location**: `src/frameworks/frameworks.service.spec.ts`

**What We Test**:
- ✅ Framework CRUD operations (Create, Read, Update, Delete)
- ✅ Control CRUD operations
- ✅ Data returned matches what was stored (no transformation)
- ✅ No soft deletes (hard delete only)
- ✅ No multi-tenancy filtering (single tenant)
- ✅ No authentication required (public access)
- ✅ No side effects (no emails, webhooks, notifications)
- ✅ Domain field is required for controls
- ✅ Domain filtering with exact match
- ✅ Domain filter returns all controls when not specified

**Test Count**: 19 tests (including 4 domain field tests)
**All Passing**: ✅

### Integration Tests (`*.e2e-spec.ts`)

**Location**: `test/frameworks.e2e-spec.ts`

**What We Test**:
- ✅ Full API endpoints work end-to-end
- ✅ Validation pipes reject invalid data
- ✅ Auto-generated UUIDs for IDs
- ✅ Timestamps auto-set and auto-update
- ✅ Hard delete (not soft delete)
- ✅ No authentication blocking requests
- ✅ No unwhitelisted fields accepted
- ✅ No rate limiting
- ✅ Nested resource endpoints (controls under frameworks)
- ✅ Domain field validation (required for controls)
- ✅ Domain filtering via query parameter (exact match)
- ✅ Domain filter returns all when not specified

## Running Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- frameworks.service.spec.ts

# Run with coverage
npm run test:cov

# Run E2E tests (requires test database)
npm run test:e2e
```

## Test Database Setup

E2E tests use a separate test database:

```bash
# Create test database
psql -U grcadmin -d postgres -c "CREATE DATABASE grc_test;"

# Tests will auto-sync schema (synchronize: true)
# Tests will drop schema on each run (dropSchema: true)
```

## What We DON'T Test

We explicitly DON'T test for features that aren't implemented:

- ❌ Authentication/Authorization (not implemented)
- ❌ Multi-tenancy (not implemented)
- ❌ Soft deletes (not implemented)
- ❌ Rate limiting (not implemented)
- ❌ Email notifications (not implemented)
- ❌ Webhooks (not implemented)
- ❌ Background jobs (not implemented)

If we add these features later, we'll add tests. But for now, tests ensure they DON'T exist.

## Test Results Summary

```
PASS src/frameworks/frameworks.service.spec.ts
  FrameworksService - Intended Functionality Only
    Framework CRUD - Core Functionality
      ✓ should create a framework with required fields only
      ✓ should retrieve all frameworks without filters
      ✓ should retrieve a single framework by ID
      ✓ should update a framework
      ✓ should delete a framework
    Control CRUD - Core Functionality
      ✓ should create a control with required fields
      ✓ should retrieve controls for a framework
      ✓ should update a control
      ✓ should delete a control
    Data Integrity - What Should NOT Happen
      ✓ should NOT allow creating framework without required fields
      ✓ should NOT expose soft-deleted records (no soft delete)
      ✓ should NOT have multi-tenancy filtering (single tenant)
    Intended Behavior Only
      ✓ should return data exactly as stored (no transformation)
      ✓ should only perform CRUD operations (no side effects)
      ✓ should not require authentication (public access)
    Domain Field - Required and Filtering
      ✓ should NOT allow creating control without domain field
      ✓ should create a control with domain as required field
      ✓ should filter controls by domain (exact match)
      ✓ should return all controls when no domain filter is provided

Test Suites: 1 passed
Tests:       19 passed
```

## Key Principles

1. **Simplicity**: Tests are straightforward, no complex mocking
2. **Intent**: Each test has a clear purpose documented in its name
3. **Negative Testing**: We test what should NOT happen, not just what should
4. **No Assumptions**: Tests verify actual behavior, not assumptions
5. **Fast**: Unit tests run in ~1 second

## Adding New Tests

When adding new functionality:

1. Write test FIRST (TDD)
2. Test both positive and negative cases
3. Verify no unintended side effects
4. Document what the test verifies in a comment
5. Keep tests simple and readable

## Continuous Integration

Tests should run on:
- Every commit
- Every pull request
- Before deployment

**All tests must pass before merging code.**
