# Chat with Video

An interactive CLI tool that enables AI-powered conversations about YouTube videos using Claude 4 Sonnet. Simply provide a YouTube URL, select subtitles, and start chatting about the video content.

## Features

- 🎥 YouTube video processing with subtitle extraction
- 🤖 AI-powered chat using Claude 4 Sonnet via Anthropic API
- 📝 Automatic subtitle download and text conversion
- 💬 Interactive chat interface with streaming responses
- ⚡ Built with TypeScript, React Ink, and modern CLI tools
- 🔧 Special commands for enhanced user experience

## Prerequisites

- Node.js 16 or higher
- yt-dlp installed and available in PATH
- Anthropic API key

### Install yt-dlp

```bash
# Using pip
pip install yt-dlp

# Using Homebrew (macOS)
brew install yt-dlp

# Or follow the official installation guide:
# https://github.com/yt-dlp/yt-dlp#installation
```

## Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env
   # Add your Anthropic API key to the .env file
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. **Build the project**
   ```bash
   pnpm build
   ```

## Usage

### Basic Usage

```bash
# Run directly with pnpm
pnpm start "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"

# Or build and run
pnpm build:start "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
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
- `/clear` - Clear the message history
- `/exit` - Exit the chat and close the application

## How It Works

1. **Video Analysis**: Validates the YouTube URL and checks for yt-dlp availability
2. **Subtitle Selection**: Displays available subtitles (uploaded or auto-generated)
3. **Content Processing**: Downloads and converts subtitles to plain text
4. **AI Integration**: Initializes Claude 4 Sonnet with the video transcript
5. **Interactive Chat**: Enables real-time conversation about the video content

## Example Session

```bash
$ pnpm start "https://www.youtube.com/watch?v=example"

🎥 Processing YouTube video...
URL: https://www.youtube.com/watch?v=example

Available subtitles:
❯ English (en) - auto-generated
  Spanish (es) - auto-generated

✅ Selected subtitle: English (en)
📁 Downloading subtitle file...
✅ Transcript downloaded successfully!
🚀 Chat mode ready!

Type your first question to start chatting...

> What is this video about?

🤖 This video discusses the fundamentals of artificial intelligence...

> Can you give me the key points?

🤖 Here are the main points covered:
1. Machine learning basics
2. Neural network architectures
...

> /transcript
🤖 Full Video Transcript:

[00:00] Welcome to this comprehensive guide...
[00:15] In today's session, we'll explore...
...
```

## Development

### Development Commands

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build for production
pnpm build

# Development with auto-rebuild
pnpm dev
```

### Project Structure

```
src/
├── components/          # React Ink UI components
│   ├── ChatInterface.tsx
│   ├── ChatInput.tsx
│   ├── ChatWithVideoEnhanced.tsx
│   └── SubtitlesSelection.tsx
├── services/           # Core business logic
│   ├── ai.ts          # Claude AI integration
│   └── subtitle.ts    # YouTube subtitle processing
├── types/             # TypeScript type definitions
│   ├── chat.ts
│   └── chat-state.ts
├── utils/             # Utility functions
│   ├── chat-commands.ts
│   ├── env.ts
│   └── youtube.ts
└── cli.enhanced.ts    # Enhanced CLI entry point
```

### Testing

The project includes comprehensive test coverage:

- Unit tests for all services and utilities
- Component tests using Ink Testing Library
- Integration tests for the complete chat flow
- Type safety validation with TypeScript

```bash
# Run specific test files
pnpm exec vitest run src/services/ai.test.ts
pnpm exec vitest run src/components/ChatInterface.test.tsx

# Run all chat-related tests
pnpm exec vitest run src/utils/chat-commands.test.ts src/components/ChatInterface.test.tsx src/components/ChatInput.test.tsx src/services/ai.test.ts
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Claude access |

Get your API key from: [Anthropic Console](https://console.anthropic.com/)

## Troubleshooting

### Common Issues

1. **"yt-dlp is not installed"**
   - Install yt-dlp using the methods shown in Prerequisites

2. **"ANTHROPIC_API_KEY environment variable is required"**
   - Ensure you've created a .env file with your API key
   - Verify the API key is valid and has sufficient credits

3. **"No subtitles available"**
   - Some videos may not have subtitles available
   - Try videos with auto-generated captions

4. **Slow responses**
   - Claude API responses depend on network and API load
   - Streaming is implemented to show progressive responses

## API Usage and Costs

This tool uses the Anthropic Claude API, which is a paid service. Each conversation consumes API tokens based on:
- The length of the video transcript (sent as system context)
- The length of your messages and Claude's responses
- The conversation history

Monitor your usage in the [Anthropic Console](https://console.anthropic.com/).

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Run the test suite (`pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Roadmap

- [ ] Support for multiple AI providers (OpenAI, Gemini)
- [ ] Conversation export functionality
- [ ] Video timestamp linking
- [ ] Multi-language subtitle support
- [ ] Conversation templates for common use cases
- [ ] Local subtitle file support
- [ ] Video summary generation

---

Built with ❤️ using TypeScript, React Ink, and Claude AI.
