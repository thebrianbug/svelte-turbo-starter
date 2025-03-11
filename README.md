# Turborepo Svelte Starter

A full-featured monorepo starter template using [Turborepo](https://turbo.build/) and [SvelteKit 2](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/docs/svelte/overview).

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Development](#development)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Testing](#testing)
- [Available Scripts](#available-scripts)

## Quick Start

### Prerequisites

- Node.js >= 18 ([download](https://nodejs.org/))
- npm >= 10 (upgrade: `npm install -g npm@latest`)
- [Docker](https://www.docker.com/) or [Podman](https://podman.io/) with compose plugin

### Setup

1. Clone and install:

   ```sh
   git clone git@github.com:thebrianbug/svelte-turbo-starter.git
   cd svelte-turbo-starter
   npm install
   ```

2. Start development:
   ```sh
   npm run dev
   ```

## Features

- 📦 [Turborepo](https://turbo.build/) monorepo management
- ⚡ [SvelteKit 2](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/)
- 🎨 [Tailwind CSS](https://tailwindcss.com/) v3
- 🔍 [TypeScript](https://www.typescriptlang.org/) v5
- 🗄️ PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- 🧪 [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/) testing
- 📝 [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/)
- 🚀 [Vercel](https://vercel.com/) deployment ready
- 🏗️ Domain-driven design architecture
- 🔄 Fast CI pipeline with caching and smart concurrency

### Roadmap

- [ ] Example users list CRUD UI
- [ ] [Svelte-Clerk](https://github.com/wobsoriano/svelte-clerk) auth integration
- [ ] [Storybook](https://storybook.js.org/) with [Svelte 5](https://storybook.js.org/blog/storybook-8-4/)
- [ ] Tailwind v4 upgrade ([tracking issue](https://github.com/vercel/turborepo/issues/9895))

## Development

### Available Scripts

#### Main Commands

- `npm run dev` - Development mode
- `npm run build` - Build all apps
- `npm run preview` - Preview builds
- `npm run clean` - Clean outputs
- `npm run format` - Format code
- `npm run check` - Type check
- `npm run lint` - Lint code

#### Testing

- `npm run test` - All tests
- `npm run test:unit` - Unit tests
- `npm run test:e2e` - E2E tests
- `npm run kill:e2e` - Kill test browsers

#### Database

- `npm run docker:up` - Start PostgreSQL
- `npm run docker:down` - Stop PostgreSQL

## Project Structure

```
.
├── apps/
│   ├── docs/              # Documentation site
│   └── web/              # Main application
├── packages/
│   ├── bll/              # Business Logic Layer
│   ├── db/               # Database Layer
│   ├── ui/               # Shared components
│   ├── eslint-config/    # ESLint config
│   ├── tailwind-config/  # Tailwind config
│   └── typescript-config/ # TypeScript config
```

### Package Details

- `web`: Main SvelteKit application
- `docs`: Documentation site with SvelteKit
- `bll`: Business Logic Layer with DDD patterns
- `db`: Database layer with Drizzle ORM
- `ui`: Shared Svelte component library
- `*-config`: Shared tooling configurations

## Architecture

### Domain-Driven Design

1. **Domain Models** (`packages/db/src/models/`)

   - Entity definitions and value objects
   - Aggregate roots and domain events
   - Rich domain models over anemic data structures

2. **Domain Services** (`packages/bll/src/domains/`)

   - Complex domain operations
   - Business rules implementation
   - Aggregate coordination

3. **Repository Layer** (`packages/db/src/repositories/`)
   - Data access patterns
   - Transaction handling
   - Query implementations

### Error Handling

1. **DB Layer** (`packages/db`)

   - DatabaseError wrapping
   - Operation context tracking
   - Data validation
   - Repository method error handling

2. **BLL Layer** (`packages/bll`)

   - Domain-specific errors
   - Business rule validation
   - Error mapping from DB layer
   - Domain validation

3. **Shared Layer** (`packages/shared`)
   - Base error classes
   - Common error types
   - Error metadata and timestamps
   - Error serialization

## Testing

### Integration Tests

- Located in `packages/*/tests/integration/`
- Transaction-based repositories
- Factory function service creation
- Automatic operation rollback
- Domain-organized test structure

### Unit Tests

- Located next to source files (`*.test.ts`)
- ts-mockito for mocking
- TDD principles
- Isolated business logic testing

### E2E Tests

- Located in `apps/*/tests/`
- Playwright-based
- Full workflow testing
- Integration verification

  - Repositories created through factory functions
  - BLL services receive repository interfaces through DI
  - Enables proper mocking in unit tests

2. **Transaction Management**:

   - Use transaction-based repositories for test isolation
   - All operations within a test are rolled back
   - Proper error propagation through layers

3. **Error Handling Best Practices**:
   - Always use appropriate error types from shared layer
   - Include relevant context in error metadata
   - Map low-level errors to domain errors
   - Validate input at domain boundaries

### Testing Best Practices

1. **Integration Tests**:

   - Test complete workflows
   - Verify error scenarios
   - Test concurrent operations
   - Use transaction isolation

2. **Unit Tests**:

   - Mock external dependencies
   - Test edge cases
   - Verify error handling
   - Focus on business logic

3. **Test Data Management**:
   - Use factory functions for test data
   - Clean up test data automatically
   - Maintain test isolation
   - Use meaningful test names

## Development Workflow

1. **Start Development**

   ```sh
   npm run dev
   ```

   This will start both the main app and docs site in development mode using [Vite's](https://vitejs.dev/) dev server. The URLs will be displayed in your terminal when the servers start.

2. **Making Changes**

   - Components in the `ui` package can be used by both applications
   - Business logic should be implemented in the `bll` package following DDD principles
   - Database operations should use the `db` package with Drizzle ORM
   - Changes to shared packages will automatically trigger rebuilds in dependent apps
   - Use `npm run format` before committing to ensure consistent code style

3. **Testing**

   - Write unit tests with [Vitest](https://vitest.dev/) (`.test.ts` extension)
   - Write end-to-end tests with [Playwright](https://playwright.dev/) in the `tests` directory
   - Each app runs tests with `npm run test` (runs e2e then unit tests)
   - Run `npm run test:unit` for unit tests only
   - Run `npm run test:e2e` for Playwright e2e tests
   - Use `npm run kill:e2e` to clean up any hanging test processes

4. **Database**

   The project includes a PostgreSQL database configuration using Docker Compose or Podman Compose:

   ```sh
   npm run docker:up    # Start PostgreSQL (uses Docker or falls back to Podman)
   npm run docker:down  # Stop PostgreSQL (uses Docker or falls back to Podman)
   ```

   Connection details:

   - Host: localhost
   - Port: 5432
   - User: postgres
   - Password: postgres
   - Database: svelte_turbo_db

5. **Building for Production**
   ```sh
   npm run build
   npm run preview  # Preview the built applications
   ```

## Type Checking

The project uses TypeScript for static type checking:

- Run `npm run check` to verify types across all projects
- TypeScript configuration is shared through the `typescript-config` package
- Each app and package has its own `tsconfig.json` that extends the shared config
- Database schema types are automatically generated by Drizzle ORM

## LLM Coding Assistant Context

When using AI coding assistants like GitHub Copilot or Claude, provide this system context for optimal code generation:

```md
Tech Stack:

- Frontend: Svelte 5 (Svelte 5 syntax only) + TypeScript, Vite v6, TailwindCSS v3
- Backend: PostgreSQL with Docker/Podman, Drizzle ORM
- Architecture: Domain-driven design, Modular structure (UI, BLL, DB layers)
- Testing: Vitest for unit/integration, Playwright for E2E
- Quality: TypeScript v5, ESLint (security, promise, sonar, unicorn plugins), Prettier with Svelte plugin
- Node.js >=18, NPM 10

Testing Notes:

- ts-mockito is used for mocking in unit tests
- Follow TDD principles: write tests first, then implementation
- Place unit tests next to source files with .test.ts extension
- E2E tests go in the tests/ directory of each app
```

> **Note**: See the [scripts](./scripts/README.md) for additional utility scripts to help with LLM.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Ensure you have the prerequisites installed
2. Fork and clone the repository
3. Install dependencies: `npm install`
4. Create a branch for your changes
5. Make your changes
6. Run tests: `npm run test`
7. Submit a pull request
