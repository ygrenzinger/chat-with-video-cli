# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chat with Video is a CLI tool that enables AI-powered conversations about YouTube videos using Claude 4 Sonnet. The application downloads video subtitles and creates an interactive chat interface where users can ask questions about the video content.

## Key Commands

- **Development**: `pnpm dev` (watch mode with auto-rebuild using Vite)
- **Build**: `pnpm build` (production build)
- **Start**: `pnpm start` (run the CLI tool)
- **Build & Start**: `pnpm build:start` (build then run)
- **Test**: `pnpm test` (run all tests with Vitest)
- **Test Watch**: `pnpm test:watch` (run tests in watch mode)
- **Test Single File**: `pnpm exec vitest run path/to/test.spec.ts`
- **Type Check**: `pnpm typecheck` (TypeScript compiler check)
- **Lint**: `pnpm lint` (ESLint for TypeScript)
- **Format**: `pnpm format` (Prettier formatting)

## Architecture

### Core Flow
1. **CLI Entry** (`src/cli.ts`): Validates YouTube URL and environment setup
2. **Main Component** (`src/components/ChatWithVideo.tsx`): State machine managing the entire flow:
   - Subtitle selection → Download → Chat initialization → Active chat
3. **Subtitle Service** (`src/services/yt-dlp-subtitle.ts`): Downloads subtitles using yt-dlp
4. **Chat Service** (`src/services/chat.service.ts`): Handles AI integration with Anthropic Claude
5. **UI Components**: React Ink components for terminal interface

### Key State Machine
The `ChatWithVideo` component uses a discriminated union type for clear state management:
- `started` → `subtitle-selected` → `chat-initializing` → `chat-ready` → `chat-active`

### Dependencies
- **CLI Framework**: Commander.js for argument parsing
- **UI Framework**: React Ink for terminal interface
- **AI Integration**: Anthropic AI SDK with Claude 4 Sonnet
- **External Tool**: yt-dlp for subtitle download (must be installed separately)
- **Testing**: Vitest with node environment and ink-testing-library

## Development Guidelines

### Code Style
- **Module System**: ES modules only (`type: "module"`)
- **TypeScript**: Strict mode, prefer `type` over `interface`, use discriminated unions for state
- **React**: Functional components with TypeScript
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Exports**: Named exports preferred, no barrel files (import directly from source files)

### TDD Build Mode Protocol
When implementing new features, follow Red → Green → Refactor cycle:
1. Write ONE failing test for smallest increment
2. Write minimal code to make ONLY that test pass
3. Clean up code when all tests are green
4. Run tests after every change

### Testing Structure
- **Unit Tests**: All services and utilities have comprehensive test coverage
- **Component Tests**: React components tested with ink-testing-library
- **Coverage**: 80% minimum threshold for branches, functions, lines, and statements
- **Environment**: Tests run in Node.js environment via Vitest

## Environment Setup

Required environment variables:
- `ANTHROPIC_API_KEY`: API key for Claude access (required)

External dependencies:
- `yt-dlp`: Must be installed and available in PATH for subtitle download

## Special Commands in Chat Mode

- `/help`: Display available commands
- `/transcript`: Show full video transcript
- `/clear`: Clear message history
- `/exit`: Exit the application