# Agent Guidelines for CLI Tool Development

## Build & Test Commands
- **Build**: `pnpm build` (uses Vite for TypeScript compilation)
- **Development**: `pnpm dev` (watch mode with auto-rebuild)
- **Test**: `pnpm test` (interactive) or `pnpm test:run` (single run)
- **Test single file**: `pnpm exec vitest run path/to/test.spec.ts`
- **Lint**: `pnpm lint` (ESLint for TypeScript)
- **Type check**: `pnpm typecheck` (TypeScript compiler check)

## Code Style Guidelines
- **Module system**: ES modules only (`type: "module"`)
- **Imports**: Use `.js` extensions for local imports (not `.ts`)
- **TypeScript**: Strict mode enabled, use interfaces for props
- **React**: Functional components with TypeScript interfaces
- **CLI**: Commander.js for command structure, React Ink for UI
- **Naming**: PascalCase for components, camelCase for functions/variables
- **File structure**: Commands in `src/commands/`, components in `src/components/`
- **Exports**: Named exports preferred, use `export const` for functions
- **Barrel files**: Avoid barrel files (`index.ts` files that re-export from other modules). Import directly from source files instead

## Dependencies
- React Ink for CLI UI components
- Commander.js for CLI argument parsing
- Vitest for testing with node environment