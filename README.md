# Turborepo Svelte Starter

A full-featured monorepo starter template using [Turborepo](https://turbo.build/) and [SvelteKit 2](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/docs/svelte/overview). This template provides a scalable foundation for building modern web applications with shared components, consistent tooling, and efficient workflows.

## Features

- 📦 Monorepo management with [Turborepo](https://turbo.build/)
- ⚡ [SvelteKit 2](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/) for both main app and documentation
- 🚀 [Vercel](https://vercel.com/) adapter pre-configured
- 🎨 [Tailwind CSS](https://tailwindcss.com/) v3.4.1 for styling
- 📚 Shared UI component library
- 🔍 [TypeScript](https://www.typescriptlang.org/) v5.5.3 for type safety
- 🧪 Testing setup with [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/)
- 📝 Consistent code style with [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/)
- 🗄️ PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations
- 🏗️ Domain-driven design architecture with clear separation of concerns
- 🔄 Fast CI pipeline with:
  - Static analysis (format and lint checks)
  - Unit testing with [Vitest](https://vitest.dev/)
  - End-to-end testing with [Playwright](https://playwright.dev/)
  - Optimized caching for dependencies and browsers
  - Smart concurrency to cancel redundant runs

## TODO

- [ ] Finish example users list CRUD UI
- [ ] Integrate with Clerk for Auth
- [ ] 📚 Add Storybook support in UI package with [Svelte 5](https://storybook.js.org/blog/storybook-8-4/)

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
- npm >= 10.8.2 (comes with Node.js)
  - Upgrade to latest version: `npm install -g npm@latest`
  - Verify installation: `npm --version`
- Either [Docker](https://www.docker.com/) or [Podman](https://podman.io/) with compose plugin
  - For Docker: Install Docker Desktop or Docker Engine with Docker Compose
  - For Podman: Install Podman and podman-compose

## Getting Started

1. Clone the repository:

   ```sh
   git clone git@github.com:thebrianbug/svelte-turbo-starter.git
   cd svelte-turbo-starter
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm run dev
   ```

## Project Structure

```
.
├── apps/
│   ├── docs/              # Documentation site built with SvelteKit
│   └── web/              # Main web application
├── packages/
│   ├── bll/              # Business Logic Layer (DDD patterns)
│   │   └── src/
│   │       └── domains/  # Domain-specific business logic
│   ├── db/               # Database Layer with Drizzle ORM
│   │   ├── drizzle/     # Database migrations
│   │   └── src/
│   │       ├── database/ # Database configuration
│   │       └── domains/  # Domain-specific repositories
│   ├── eslint-config/    # Shared ESLint configuration
│   ├── tailwind-config/  # Shared Tailwind CSS configuration
│   ├── typescript-config/ # Shared TypeScript configuration
│   └── ui/              # Shared UI component library
```

### Apps

- `web`: The main SvelteKit application
- `docs`: A documentation site also built with SvelteKit, perfect for component documentation and guides

### Packages

- `bll`: Business Logic Layer implementing domain-driven design patterns
- `db`: Database layer using Drizzle ORM for PostgreSQL operations
- `ui`: A shared [Svelte](https://svelte.dev/) component library used by both applications
- `eslint-config`: Common ESLint configuration with security, promise, sonar, and unicorn plugins
- `tailwind-config`: Shared Tailwind CSS configuration
- `typescript-config`: Shared TypeScript configuration for consistent type checking

## Available Scripts

- `npm run dev` - Start all applications in development mode using [Vite](https://vitejs.dev/) v6.1.0
- `npm run build` - Build all applications and packages
- `npm run preview` - Preview the built applications
- `npm run clean` - Clean build outputs and node_modules directories
- `npm run format` - Format all files using [Prettier](https://prettier.io/) with Svelte plugin
- `npm run check` - Run [SvelteKit](https://kit.svelte.dev/) sync, type checking, and format verification
- `npm run lint` - Run [ESLint](https://eslint.org/) across all projects

### Testing Scripts

- `npm run test` - Run all tests (unit and e2e) across all applications
- `npm run test:unit` - Run [Vitest](https://vitest.dev/) unit tests across all applications
- `npm run test:e2e` - Run [Playwright](https://playwright.dev/) end-to-end tests for both apps
- `npm run kill:e2e` - Kill any hanging Playwright browser processes
- `npm run db:up` - Start PostgreSQL database in Docker/Podman
- `npm run db:down` - Stop and remove PostgreSQL container

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
   npm run db:up    # Start PostgreSQL (uses Docker or falls back to Podman)
   npm run db:down  # Stop PostgreSQL (uses Docker or falls back to Podman)
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

- Frontend: Svelte 5 (Svelte 5 syntax only) + TypeScript, Vite 6.1.0, TailwindCSS 3.4.1
- Backend: PostgreSQL with Docker/Podman, Drizzle ORM
- Architecture: Domain-driven design, Modular structure (UI, BLL, DB layers)
- Testing: Vitest for unit/integration, Playwright for E2E
- Quality: TypeScript 5.5.3, ESLint (security, promise, sonar, unicorn plugins), Prettier with Svelte plugin
- Node.js >=18, NPM 10.8.2

Testing Notes:

- ts-mockito is used for mocking in unit tests
- Follow TDD principles: write tests first, then implementation
- Place unit tests next to source files with .test.ts extension
- E2E tests go in the tests/ directory of each app
```

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
