# Project Guidelines — chat-with-video

Audience: Advanced developers contributing to this repository.

This document captures project-specific practices for building, testing, debugging, and evolving the codebase. It integrates and adapts the AGENTS rules from AGENTS.md to the specifics of this codebase.


## 1) Build and Configuration

- Toolchain
  - Node.js: >= 16 (see package.json engines)
  - Package manager: pnpm (>= 10 is fine)
  - TypeScript: 5.x, Vite 7.x
  - Test runner: Vitest 3.x
  - UI runtime: React 19 + Ink 6 (CLI UI)

- Commands (from package.json)
  - Build: `pnpm build` (Vite build to dist/)
  - Development (watch build): `pnpm dev`
  - Start CLI (after build): `pnpm start`
  - Lint: `pnpm lint`
  - Type check: `pnpm typecheck`
  - Format: `pnpm format`
  - Tests (all): `pnpm test`
  - Tests (watch UI): `pnpm test:watch`

- Environment variables
  - ANTHROPIC_API_KEY is required for actual runtime CLI features. For most unit tests, it isn’t strictly required. The CLI has tests that validate missing env handling.
  - Local dev: `cp .env.example .env` and set `ANTHROPIC_API_KEY=...` when you want to exercise the real AI flows.

- External binary dependency
  - yt-dlp must be installed and available on PATH for actual subtitle fetching flows. Unit tests mock or isolate most of this interaction, but some tests simulate the command calls (stdout logging is visible during test runs).

- Module resolution
  - ESM only: `"type": "module"`
  - Path alias: `@` -> `src` (see vitest.config.ts `resolve.alias`)


## 2) Testing: How to Configure and Run

Vitest is configured via vitest.config.ts:
- test.environment = "node"
- coverage provider = v8, reports to ./coverage (json, html, text)
- coverage include: `src/**/*.{ts,tsx}`
- coverage excludes tests, types, and node_modules
- global thresholds: 80% branches/functions/lines/statements

Recommended flows:
- Run a subset of tests (fast inner loop):
  - `pnpm exec vitest run path/to/file.test.ts`
  - Example: `pnpm exec vitest run src/utils/youtube.test.ts`
- Run all tests: `pnpm test`
  - Note: The full suite includes Ink component tests and CLI behavior checks. If you’re working on specific modules, prefer targeted runs to keep feedback tight.
- Watch mode: `pnpm test:watch`
- Coverage: `pnpm exec vitest run --coverage` (or `pnpm test -- --coverage`)

Ink component testing:
- We use `ink-testing-library` to render components and inspect frames. Make sure any raw text is wrapped in `<Text>` components; Ink 6 enforces this.
- Example pitfall: Printing a raw string child directly inside a component will raise: `Text string "..." must be rendered inside <Text> component`.
- Prefer pure rendering + assertions on `lastFrame()` for deterministic tests.

yt-dlp interactions:
- Tests do not require the actual binary to succeed; they stub or work with controlled outputs. If adding tests around yt-dlp:
  - Abstract the `spawn` or command layer so it can be mocked.
  - Write deterministic assertions on command strings and parsing logic.

Error handling and CLI tests:
- There is a test validating graceful failure when ANTHROPIC_API_KEY is not set. Keep user-facing error messages stable or update related assertions.


### 2.1) Adding a New Test (Demonstration)

Process we validated locally:
1) Create a new file, e.g. `src/__tests__/sanity.demo.test.ts` with the following content:

```ts
import { describe, it, expect } from 'vitest'

describe('sanity.demo', () => {
  it('adds numbers correctly', () => {
    expect(1 + 2).toBe(3)
  })

  it('works with async/await', async () => {
    const value = await Promise.resolve('ok')
    expect(value).toBe('ok')
  })
})
```

2) Run only that test file:

```bash
pnpm exec vitest run src/__tests__/sanity.demo.test.ts
```

Expected outcome (sample):

```
✓ src/__tests__/sanity.demo.test.ts (2 tests)
  ✓ sanity.demo > adds numbers correctly
  ✓ sanity.demo > works with async/await
```

3) Remove the file after verification to keep the repo clean. We’ve already followed this process and removed the demo file; keep this snippet for reference when documenting ‘how to add tests’ in PRs.

Notes:
- If you run `pnpm test` for the whole suite, be aware component tests enforce Ink’s `<Text>` rule. This increases test relevance but can fail quickly if you render raw strings without `<Text>`.


## 3) Development Conventions and Style

This section adapts and applies AGENTS.md to this repository.

- TDD Build Mode Rules (adapted)
  - Red → Green → Refactor. One failing test at a time. Implement only enough to pass that test. Refactor once green.
  - No production code without a failing test first when adding behavior.
  - Run tests after every change; keep increments minimal.
  - Present changes only when all tests you’ve touched are green and lint/typecheck pass.

- One Thing Rule
  - One test at a time; don’t mix structural refactors with behavioral changes.
  - Avoid bundling unrelated changes in a single PR; one logical unit at a time.

- Code Style
  - ES modules only, named exports preferred; use `export const` for functions.
  - TypeScript strict discipline: prefer `type` aliases for props and unions; avoid nullable fields that model state—use discriminated unions where practical.
  - React components are functional and typed. For Ink components: ensure any textual content is wrapped in `<Text>`.
  - Avoid barrel files; import directly from source modules.
  - Naming: PascalCase for components, camelCase for functions/variables.

- File structure (pragmatic view)
  - CLI/Ink components: `src/components/`
  - Services: `src/services/`
  - Utilities: `src/utils/`
  - Types: `src/types/`
  - Enhanced CLI entry: `src/cli.enhanced.ts`

- Commit etiquette
  - Keep commits scoped to a single concern and passing tests. Prefer small, readable diffs.


## 4) Debugging and Troubleshooting

- Ink runtime errors
  - Symptom: `Text string "..." must be rendered inside <Text> component`.
  - Fix: Wrap any plain string children in `<Text>`.

- Environment validation
  - The CLI can exit early if `ANTHROPIC_API_KEY` is missing; tests confirm messaging. Ensure `.env` exists when you actually want to exercise AI flows.

- Subtitles and conversion
  - `srt`/`vtt` conversion utilities log conversion steps during tests. Use a temp dir pattern and assert on generated text rather than exact paths when possible.

- Coverage thresholds
  - Global minimum 80%. If you add code, add tests alongside to keep coverage above thresholds.


## 5) Quickstart for Contributors

- Install: `pnpm install`
- Lint + types: `pnpm lint && pnpm typecheck`
- Run specific tests for your area: `pnpm exec vitest run src/utils/your.test.ts`
- Build: `pnpm build` and run CLI: `pnpm start "https://www.youtube.com/watch?v=..."`
- If dealing with real transcripts, ensure yt-dlp is installed.


## 6) Notes on Running the Full Suite

- Running `pnpm test` will execute component tests using Ink and can catch rendering contract violations quickly. If you’re iterating on isolated logic, prefer targeted test files for faster cycles.
- Some tests intentionally simulate external tool output (yt-dlp). Do not rely on network or remote resources in tests—keep them deterministic.


## 7) PR Expectations

- Follow TDD rules above. Include tests for new behavior.
- Keep public CLI user messages stable; if you change them, update tests accordingly.
- Ensure lint, typecheck, and at least the tests for the affected area pass before opening a PR.
