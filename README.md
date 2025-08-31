# Chat with Video

An interactive CLI tool that enables AI-powered conversations about videos, mainly Youtube but any other yt-dlp compatible website, will work.
It can use multiple AI providers -> read [AI Provider Setup section](#ai-provider-setup). Good tip: Google flash model is mostly free for this usage.
Simply provide a YouTube URL, select subtitles, and start chatting about the video content.
You have also a few interactive commands to help you -> see [Interactive Chat Commands section](#interactive-chat-commands).

## Important Note

This project has been mainly developed for fun through vibe coding.
The goal was mainly to learn Agentic Coding best practices and limits.
So don't be to demanding about the quality of the UX and the code (especially the tests).
But feedback and even PRs are always welcome ;)

## Features

- 🎥 Video subtitle extraction
- 📝 Automatic subtitle download and text conversion
- 🤖 Multi-AI provider support (Mistral, OpenAI, Google, Anthropic) with automatic detection
- 💬 Interactive chat interface with streaming responses
- 📋 Chat history management with copy and save functionality
- ⚡ Built with TypeScript, React Ink, and modern CLI tools
- 🔧 Enhanced commands for productivity

---

# For General Users

## Installation

Install the CLI tool globally:

```bash
npm install -g chat-with-video
```

## Prerequisites

- **Node.js 22 or higher**
- **yt-dlp** (for subtitle extraction)
- **AI Provider API Key** (at least one)

### Install yt-dlp

```bash
# Using pip
pip install yt-dlp

# Using Homebrew (macOS)
brew install yt-dlp

# Or follow the official installation guide:
# https://github.com/yt-dlp/yt-dlp#installation
```

## AI Provider Setup

The tool supports multiple AI providers and will automatically use the first available one. Set up at least one:

### AI Provider Setup Options

| Provider  | API Key Source                                          | Environment Variable                                           |
|-----------|---------------------------------------------------------|----------------------------------------------------------------|
| Mistral   | [Mistral Console](https://console.mistral.ai/)          | `export MISTRAL_API_KEY=your_mistral_api_key_here`             |
| OpenAI    | [OpenAI Platform](https://platform.openai.com/api-keys) | `export OPENAI_API_KEY=your_openai_api_key_here`               |
| Google AI | [AI Studio](https://aistudio.google.com/apikey)         | `export GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here` |
| Anthropic | [Anthropic Console](https://console.anthropic.com/)     | `export ANTHROPIC_API_KEY=your_anthropic_api_key_here`         |

## Usage

### Basic Usage

```bash
chat-with-video "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
```

### Supported URL Formats

```bash
# Standard YouTube URLs
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtube.com/watch?v=dQw4w9WgXcQ

# Short URLs
https://youtu.be/dQw4w9WgXcQ
```

### Interactive Chat Commands

Once in chat mode, you can use these special commands:

- `/help` - Display available commands and usage information
- `/transcript` - Show the full video transcript
- `/summary` - Get a detailed summary of topics in the video
- `/clear` - Clear the message history
- `/copy-last` - Copy the last assistant message to clipboard
- `/copy-all` - Copy the full chat history to clipboard
- `/save-to-file` - Save the full chat history to a markdown file
- `/exit` - Exit the chat and close the application

## How It Works

1. **Video Analysis**: Validates the YouTube URL and checks for yt-dlp availability
2. **AI Provider Detection**: Automatically detects the first available AI provider (Mistral → OpenAI → Google → Anthropic)
3. **Subtitle Selection**: Displays available subtitles (uploaded or auto-generated)
4. **Content Processing**: Downloads and converts subtitles to plain text
5. **AI Integration**: Initializes the selected AI model with the video transcript
6. **Interactive Chat**: Enables real-time conversation about the video content

## Example Session

```bash
$ chat-with-video "https://www.youtube.com/watch?v=example"

🎥 Processing YouTube video...
URL: https://www.youtube.com/watch?v=example

Available subtitles:
❯ English (en) - auto-generated
  Spanish (es) - auto-generated

✅ Selected subtitle: English (en)
📁 Downloading subtitle file...
✅ Transcript downloaded successfully!
🤖 Using Mistral AI (mistral-large-latest)
🚀 Chat mode ready!

Type your first question to start chatting...

> What is this video about?

🤖 This video discusses the fundamentals of artificial intelligence...

> Can you give me the key points?

🤖 Here are the main points covered:
1. Machine learning basics
2. Neural network architectures
...

> /save-to-file
✅ Chat history saved to: fundamentals of artificial intelligence.md

> /exit
👋 Goodbye!
```

## Troubleshooting

### Common Issues

1. **"yt-dlp is not installed"**
   - Install yt-dlp using the methods shown in Prerequisites

2. **"No API key found for any supported AI provider"**
   - Set up at least one API key from the supported providers
   - Verify environment variables are properly exported

3. **"No subtitles available"**
   - Some videos may not have subtitles available
   - Try videos with auto-generated captions

4. **"Command 'chat-with-video' not found"**
   - Make sure you installed globally: `npm install -g chat-with-video`
   - Or use `npx chat-with-video` for one-time usage

## API Usage and Costs

This tool uses various AI APIs, which are paid services. Monitor your usage in the respective provider consoles:
- [Mistral Console](https://console.mistral.ai/)
- [OpenAI Platform](https://platform.openai.com/usage)
- [Google AI Studio](https://aistudio.google.com/)
- [Anthropic Console](https://console.anthropic.com/)

---

# For Contributors & Developers

## Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/your-repo/chat-with-video.git
   cd chat-with-video
   pnpm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env
   # Add at least one API key to the .env file
   ```

3. **Install yt-dlp**
   ```bash
   # Using pip
   pip install yt-dlp
   
   # Using Homebrew (macOS)
   brew install yt-dlp
   ```

## Development Commands

```bash
# Development with auto-rebuild (Vite watch mode)
pnpm dev

# Build for production
pnpm build

# Run the built CLI locally
pnpm start "https://www.youtube.com/watch?v=VIDEO_ID"

# Build and run
pnpm build:start "https://www.youtube.com/watch?v=VIDEO_ID"

# Testing
pnpm test              # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report

# Code quality
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint
pnpm format           # Prettier formatting
pnpm format:check     # Check formatting without fixing
```

## Architecture

### Project Structure

```
src/
├── components/              # React Ink UI components
│   ├── ChatInterface.tsx   # Main chat display component
│   ├── ChatInput.tsx       # User input component with command suggestions
│   ├── ChatStateRenderer.tsx # State-based UI rendering
│   ├── ChatWithVideo.tsx   # Main orchestrator component
│   ├── CommandSuggestions.tsx # Command autocomplete
│   └── SubtitlesSelection.tsx # Subtitle language selector
├── hooks/                   # Custom React hooks
│   ├── useChatService.ts   # Chat service initialization
│   ├── useChatState.ts     # State management hook
│   ├── useMessageHandling.ts # Message processing
│   └── useSubtitleDownload.ts # Subtitle download lifecycle
├── services/               # Core business logic
│   ├── chat.service.ts     # Chat coordination and message handling
│   ├── model-selection.service.ts # AI provider detection and selection
│   ├── subtitle.ts         # Subtitle processing interface
│   └── yt-dlp-subtitle.ts  # YouTube subtitle extraction
├── utils/                  # Utility functions and helpers
│   ├── MessageHandler.ts   # Message processing and streaming
│   ├── StateTransitionManager.ts # State machine management
│   ├── Logger.ts           # Structured logging
│   ├── chat-commands.ts    # Command parsing and validation
│   ├── env.ts              # Environment configuration
│   ├── factories.ts        # Dependency injection
│   ├── srt-converter.ts    # SRT subtitle format converter
│   ├── vtt-converter.ts    # VTT subtitle format converter
│   └── youtube.ts          # YouTube URL validation
└── chat-with-video.ts      # CLI entry point
```

### State Management Architecture

The application uses a discriminated union state machine with these states:
- `started` → `subtitle-selected` → `subtitle-downloaded` → `chat-initializing` → `chat-ready` → `chat-active`

Key components:
- **`useChatState`**: Core state management with type-safe transitions
- **`StateTransitionManager`**: Orchestrates complex state flows
- **`MessageHandler`**: Processes messages, commands, and streaming responses

### Testing Strategy

- **Unit Tests**: All services, utilities, and hooks (80% coverage minimum)
- **Component Tests**: React components using ink-testing-library  
- **Integration Tests**: Complete flow testing
- **Environment**: Node.js + jsdom dual environment setup with Vitest

```bash
# Run specific test files
pnpm exec vitest run src/services/chat.service.test.ts
pnpm exec vitest run src/components/ChatInterface.test.tsx

# Run all tests for a specific feature
pnpm exec vitest run src/utils/chat-commands.test.ts src/components/ChatInput.test.tsx
```

### Build Configuration

- **Build Tool**: Vite with custom Node.js CLI configuration
- **Module System**: ES modules (`type: "module"`)
- **Shebang Injection**: Automatic shebang addition for CLI executable
- **TypeScript**: Strict mode with discriminated unions for type safety

## Code Style & Guidelines

- **TypeScript**: Prefer `type` over `interface`, use discriminated unions
- **React**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Exports**: Named exports preferred, import directly from source files
- **Testing**: Follow TDD approach with Red→Green→Refactor cycle

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TDD approach: write tests first
4. Ensure all tests pass (`pnpm test`)
5. Check code quality (`pnpm typecheck && pnpm lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Possible roadmap

- [ ] Adding new AI provider support
- [ ] Video timestamp linking in chat responses
- [ ] Multi-language subtitle support
- [ ] Conversation templates for common use cases

## License

MIT

---

Built with ❤️ using TypeScript, React Ink, Vercel AI SDK and too much Claude Code.
