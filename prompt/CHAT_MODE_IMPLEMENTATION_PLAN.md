# Chat Mode Implementation Plan

## Overview

This document outlines the implementation plan for adding AI-powered chat functionality to the `chat-with-video` CLI tool. Once subtitles are downloaded and converted to raw text, the CLI will enter a chat mode where users can interact with Claude 4 Sonnet via the Vercel AI SDK v5 to discuss the video transcript.

## Current State Analysis

### Existing Flow
1. User provides YouTube URL
2. CLI validates URL and checks yt-dlp availability
3. `SubtitlesSelection` component displays available subtitles
4. User selects subtitle language
5. `SubtitleService` downloads and converts SRT to TXT
6. Process ends with downloaded text file

### Current Architecture
- **CLI Entry**: `src/cli.ts` - Commander.js setup with React Ink rendering
- **Main Component**: `src/components/ChatWithVideo.tsx` - State management for subtitle flow
- **Subtitle Service**: `src/services/subtitle.ts` - yt-dlp integration and text conversion
- **Utils**: SRT to text conversion utilities

## Implementation Plan

### Phase 1: Dependencies and Environment Setup

#### 1.1 Add Required Dependencies
```json
{
  "dependencies": {
    "@ai-sdk/anthropic": "^2.0.5",
    "ai": "^5.0.18",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.10"
  }
}
```

#### 1.2 Environment Configuration
- Add `.env.example` with `ANTHROPIC_API_KEY` placeholder
- Update `.gitignore` to exclude `.env` files
- Add environment validation on CLI startup

### Phase 2: Core Chat Infrastructure

#### 2.1 AI Service Implementation
**File**: `src/services/ai.ts`

```typescript
// Core service for AI interactions
export class ChatService {
  // Initialize Claude 4 Sonnet with Anthropic provider
  // Implement system prompt with transcript template
  // Handle streaming responses
  // Error handling and fallbacks
}
```

**Features**:
- Anthropic Claude 4 Sonnet configuration
- System prompt template: "You are a helpful AI that will help the user get detailed information about the transcript of this video <transcript>{transcript}</transcript>"
- Streaming response handling
- Input validation and sanitization
- Rate limiting awareness
- Error handling for API failures

#### 2.2 Chat State Management
**Enhancement**: `src/components/ChatWithVideo.tsx`

Add new state types:
```typescript
type ChatWithVideoState = 
  | { status: "started" }
  | { status: "subtitle-selected"; selectedSubtitle: SubtitleLanguage }
  | { status: "subtitle-downloaded"; /* existing */ }
  | { status: "chat-initializing"; transcript: string }
  | { status: "chat-ready"; transcript: string; chatService: AnthropicChatService }
  | { status: "chat-active"; /* chat session data */ }
```

### Phase 3: Chat UI Components

#### 3.1 Chat Interface Component
**File**: `src/components/ChatInterface.tsx`

```typescript
export const ChatInterface: React.FC<{
  transcript: string;
  chatService: AnthropicChatService;
  onExit: () => void;
}> = ({ transcript, chatService, onExit }) => {
  // User input handling with React Ink
  // Message history display
  // Streaming AI response rendering
  // Special commands (/exit, /help, /transcript)
}
```

**Features**:
- Input prompt display
- Message history with clear user/AI distinction
- Streaming text rendering for AI responses
- Loading states during AI processing
- Command handling system
- Scrollable message history

#### 3.2 Input Handling Component
**File**: `src/components/ChatInput.tsx`

```typescript
export const ChatInput: React.FC<{
  onSubmit: (message: string) => void;
  disabled: boolean;
}> = ({ onSubmit, disabled }) => {
  // Multi-line input support
  // Input validation
  // Visual feedback
}
```

**Features**:
- Text input with React Ink `useInput`
- Enter to send, Ctrl+C to cancel
- Input validation and character limits
- Visual indicators for sending state
- Multi-line support for longer questions

### Phase 4: Enhanced State Management

#### 4.1 Chat Session Management
**File**: `src/utils/chat-session.ts`

```typescript
export class ChatSession {
  // Message history management
  // Session persistence (optional)
  // Command processing
  // State synchronization
}
```

#### 4.2 Message Types and Validation
**File**: `src/types/chat.ts`

```typescript
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streamingComplete?: boolean;
};

export type ChatCommand = 
  | { type: 'exit' }
  | { type: 'help' }
  | { type: 'transcript' }
  | { type: 'clear' };
```

### Phase 5: Integration and Flow Enhancement

#### 5.1 Modified Flow Integration
Update `ChatWithVideo.tsx` to handle the new flow:

1. **Existing Flow** (unchanged until subtitle download)
2. **New Transition**: After successful text conversion
   - Load transcript content
   - Initialize `AnthropicChatService` with transcript
   - Transition to `chat-ready` state
3. **Chat Mode Entry**: 
   - Display welcome message with video info
   - Show available commands
   - Begin chat interface

#### 5.2 Error Handling and Fallbacks
- API key validation before chat mode
- Network error handling with retry options
- Graceful degradation for API failures
- Clear error messages for users

### Phase 6: Advanced Features

#### 6.1 Special Commands
- `/exit` - Exit chat mode and CLI
- `/help` - Display available commands and usage
- `/transcript` - Show the full transcript
- `/clear` - Clear message history
- `/summary` - Request AI summary of the video

#### 6.2 Enhanced User Experience
- **Startup Performance**: Lazy-load AI SDK after subtitle download
- **Context Preservation**: Maintain conversation context
- **Response Quality**: Optimize system prompt for video analysis
- **Visual Polish**: Colors, icons, and formatting for better readability

### Phase 7: Testing Strategy

#### 7.1 Unit Tests
- `ai.ts` service mocking and validation
- Chat state transitions
- Message handling and validation
- SRT to text conversion integration

#### 7.2 Integration Tests
- End-to-end flow from URL to chat
- API integration with mock responses
- Error scenarios and recovery
- Command processing

#### 7.3 Manual Testing
- Various video types and lengths
- Different subtitle languages
- Network failure scenarios
- Long conversation sessions

## Technical Considerations

### Performance Optimizations
1. **Lazy Loading**: Only initialize AI SDK after successful transcript generation
2. **Streaming Efficiency**: Implement proper streaming response handling
3. **Memory Management**: Limit message history size for long sessions
4. **Caching**: Consider transcript caching for repeated access

### Error Handling Strategy
1. **API Failures**: Graceful fallback with clear user messaging
2. **Network Issues**: Retry mechanism with exponential backoff
3. **Invalid Input**: Input validation with helpful error messages
4. **Rate Limiting**: Respect API limits with user feedback

### Security Considerations
1. **API Key Management**: Secure storage and validation
2. **Input Sanitization**: Prevent injection attacks
3. **Content Filtering**: Basic content moderation awareness
4. **Privacy**: No persistent storage of conversations by default

## Implementation Timeline

### Week 1: Foundation
- Dependencies setup and environment configuration
- Core `AnthropicChatService` implementation
- Basic chat state management

### Week 2: UI Development
- `ChatInterface` component with basic functionality
- Input handling and message display
- Integration with existing flow

### Week 3: Enhancement
- Special commands implementation
- Error handling and edge cases
- UI/UX improvements and testing

### Week 4: Polish and Testing
- Comprehensive testing suite
- Performance optimizations
- Documentation and examples

## Success Metrics

1. **Functionality**: Seamless transition from subtitle download to chat mode
2. **Performance**: Responsive streaming with <2s initial response time
3. **Usability**: Intuitive commands and clear visual feedback
4. **Reliability**: Robust error handling with <1% crash rate
5. **User Experience**: Engaging and helpful AI interactions about video content

## Future Enhancements

1. **Multi-language Support**: Handle non-English transcripts effectively
2. **Conversation Export**: Save chat sessions to files
3. **Video Timestamp Integration**: Link AI responses to specific video moments
4. **Multiple AI Providers**: Support for other LLM providers
5. **Conversation Templates**: Pre-built question templates for common use cases

---

This plan provides a comprehensive roadmap for implementing the chat mode feature while maintaining the existing codebase structure and following established patterns.
