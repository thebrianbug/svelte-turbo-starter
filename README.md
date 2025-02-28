# Turborepo Svelte Starter

A full-featured monorepo starter template using [Turborepo](https://turbo.build/) and [SvelteKit](https://kit.svelte.dev/). This template provides a scalable foundation for building modern web applications with shared components, consistent tooling, and efficient workflows.

## Features

- 📦 Monorepo management with Turborepo
- ⚡ SvelteKit for both main app and documentation
- 🎨 Tailwind CSS for styling
- 📚 Shared UI component library
- 🔍 TypeScript for type safety
- 🧪 Testing setup with Vitest and Playwright
- 📝 Consistent code style with ESLint and Prettier

## Prerequisites

- Node.js >= 18
- npm >= 10.8.2

## Getting Started

1. Create a new project using this starter:
   ```sh
   npx create-turbo@latest -e with-svelte
   ```

2. Install dependencies:
   ```sh
   cd your-project-name
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
│   ├── docs/          # Documentation site built with SvelteKit
│   └── web/          # Main web application
├── packages/
│   ├── eslint-config/    # Shared ESLint configuration
│   ├── tailwind-config/  # Shared Tailwind CSS configuration
│   ├── typescript-config/ # Shared TypeScript configuration
│   └── ui/              # Shared UI component library
```

### Apps

- `web`: The main SvelteKit application
- `docs`: A documentation site also built with SvelteKit, perfect for component documentation and guides

### Packages

- `ui`: A shared Svelte component library used by both applications
- `eslint-config`: Common ESLint configuration with Svelte and Prettier support
- `tailwind-config`: Shared Tailwind CSS configuration
- `typescript-config`: Shared TypeScript configuration for consistent type checking

## Available Scripts

- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all applications and packages
- `npm run preview` - Preview the built applications
- `npm run clean` - Clean all build outputs and node_modules
- `npm run format` - Format all files using Prettier
- `npm run check` - Run type checking and format verification
- `npm run lint` - Run ESLint across all projects

### Testing Scripts

- `npm run test` - Run all tests (unit and e2e)
- `npm run test:unit` - Run unit tests only
- `npm run test:e2e` - Run end-to-end tests (requires build)
- `npm run kill:e2e` - Kill any hanging e2e test processes

## Development Workflow

1. **Start Development**
   ```sh
   npm run dev
   ```
   This will start both the main app and docs site in development mode.
   - Main app: http://localhost:5173
   - Docs: http://localhost:5174

2. **Making Changes**
   - Components in the `ui` package can be used by both applications
   - Changes to shared packages will automatically trigger rebuilds in dependent apps
   - Use `npm run format` before committing to ensure consistent code style

3. **Testing**
   - Write unit tests alongside your components with `.test.ts` extension
   - Run `npm run test:unit` to execute unit tests
   - End-to-end tests use Playwright and can be run with `npm run test:e2e`

4. **Building for Production**
   ```sh
   npm run build
   npm run preview  # Preview the built applications
   ```

## Type Checking

The project uses TypeScript for static type checking:

- Run `npm run check` to verify types across all projects
- TypeScript configuration is shared through the `typescript-config` package
- Each app and package has its own `tsconfig.json` that extends the shared config

## Contributing

1. Ensure you have the prerequisites installed
2. Fork and clone the repository
3. Install dependencies: `npm install`
4. Create a branch for your changes
5. Make your changes
6. Run tests: `npm run test`
7. Submit a pull request
