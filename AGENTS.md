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
2. **Main Component** (`src/components/ChatWithVideo.tsx`): Orchestrates the entire application flow using custom hooks:
    - Subtitle selection → Download → Chat initialization → Active chat
3. **State Management** (`src/hooks/useChatState.ts`): Central state machine with discriminated union types
4. **Subtitle Service** (`src/services/yt-dlp-subtitle.ts`): Downloads subtitles using yt-dlp
5. **Chat Service** (`src/services/chat.service.ts`): Handles AI integration with Anthropic Claude
6. **UI Components**: React Ink components for terminal interface

### Key State Machine
The application uses a discriminated union type for clear state management (`ChatWithVideoState`):
- `started` → `subtitle-selected` → `subtitle-downloaded` → `chat-initializing` → `chat-ready` → `chat-active`

State transitions are managed through:
- **State Hook** (`useChatState`): Provides state and transition functions
- **Transition Manager** (`StateTransitionManager`): Orchestrates complex flows and validates transitions
- **Message Handler** (`MessageHandler`): Processes user messages and chat commands

### Custom Hooks Architecture
The application uses a modular hook-based architecture:
- **`useChatState`**: Core state management and transitions
- **`useSubtitleDownload`**: Handles subtitle download lifecycle
- **`useChatService`**: Manages chat service initialization
- **`useMessageHandling`**: Processes messages and streaming responses

### UI Layer
- **`ChatStateRenderer`**: Renders appropriate UI based on current state
- **`ChatInterface`**: Displays chat messages and conversation history
- **`ChatInput`**: Handles user input with command support
- **`SubtitlesSelection`**: Allows subtitle language selection

### Utilities & Services
- **Message Processing**: Command parsing (`/help`, `/transcript`, `/clear`, `/exit`)
- **Configuration**: Factory pattern for dependency injection and testing
- **Logging**: Structured logging with `Logger` utility
- **Format Converters**: SRT and VTT subtitle format support

### Dependencies
- **CLI Framework**: Commander.js for argument parsing
- **UI Framework**: React Ink for terminal interface
- **AI Integration**: Anthropic AI SDK with Claude 4 Sonnet
- **External Tool**: yt-dlp for subtitle download (must be installed separately)
- **Testing**: Vitest with node environment and ink-testing-library

## Development Guidelines

Always usecontext7 for latest documentation.

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