# Agent Guidelines for CLI Tool Development

## TDD Build Mode Rules

## Activation Trigger
**Use these rules ONLY when user asks to implement/build a plan you've created.**

## Build Mode Protocol

### Mandatory TDD Cycle
Follow **Red → Green → Refactor** strictly:

1. **🔴 RED**: Write ONE failing test for smallest increment
2. **🟢 GREEN**: Write minimal code to make ONLY that test pass
3. **🔵 REFACTOR**: Clean up code when all tests green

### Critical Constraints

#### One Thing Rule
- ✅ One test at a time
- ✅ Implement only what makes current test pass
- ✅ Never mix structural + behavioral changes
- ✅ Run tests after every change

#### Commit Points
Only present code when:
- All tests passing ✅
- No warnings ✅
- Single logical unit complete ✅

### Build Workflow
1. Write failing test → Show test (should fail)
2. Write minimal code → Show code + test results (should pass)
3. Refactor if needed → Show cleaned code + test results
4. Present complete increment → Ask for next step

### Enforcement Rules
- **No production code without failing test first**
- **If tests aren't green, fix before continuing**
- **Stop and ask user if unclear what to test next**

## Build & Test Commands
- **Build**: `pnpm build` (uses Vite for TypeScript compilation)
- **Development**: `pnpm dev` (watch mode with auto-rebuild)
- **Test**: `pnpm test` (interactive) or `pnpm test:run` (single run)
- **Test single file**: `pnpm exec vitest run path/to/test.spec.ts`
- **Lint**: `pnpm lint` (ESLint for TypeScript)
- **Type check**: `pnpm typecheck` (TypeScript compiler check)

## Code Style Guidelines
- **Module system**: ES modules only (`type: "module"`)
- **TypeScript**: Strict mode enabled, use type instead of interface, use type for props, use discriminated union types for clear state instead of having nullable or undefined properties
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

use context7