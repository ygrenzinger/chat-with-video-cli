import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { ChatStateRenderer } from './ChatStateRenderer.js'
import { type StateFrom } from 'xstate'
import { chatWithVideoMachine } from '../machines/chatWithVideo.machine.js'
import { type SubtitleService } from '../services/subtitle.js'
import { type ChatMessage, type ChatService } from '../services/chat.service.js'

vi.mock('./SubtitlesSelection.js', () => ({
  SubtitlesSelection: () => React.createElement(Text, null, 'Select Subtitle')
}))

vi.mock('./ChatInterface.js', () => ({
  ChatInterface: ({ messages }: { messages: ChatMessage[] }) =>
    React.createElement(
      Text,
      null,
      `Chat Interface - Messages: ${messages.length}`
    )
}))

vi.mock('./ChatInput.js', () => ({
  ChatInput: ({ disabled }: { disabled: boolean }) =>
    React.createElement(Text, null, disabled ? 'Processing...' : 'Type message')
}))

const createMachineState = (
  value: string,
  overrides: Partial<StateFrom<typeof chatWithVideoMachine>['context']> = {}
) =>
  ({
    value,
    context: {
      url: 'https://youtube.com/watch?v=test',
      subtitleService: {} as SubtitleService,
      chatServiceFactory: vi.fn(),
      selectedSubtitle: null,
      transcript: null,
      videoName: null,
      chatService: null,
      error: null,
      ...overrides
    },
    matches: (state: string) => state === value
  }) as unknown as StateFrom<typeof chatWithVideoMachine>

describe('ChatStateRenderer', () => {
  let mockSubtitleService: SubtitleService
  let mockOnSubtitleSelected: ReturnType<typeof vi.fn>
  let mockOnRetry: ReturnType<typeof vi.fn>
  let mockOnSendMessage: ReturnType<typeof vi.fn>
  let mockOnExit: ReturnType<typeof vi.fn>
  let exitSpy: any

  beforeEach(() => {
    mockSubtitleService = {
      isAvailable: vi.fn(),
      retrieveRawText: vi.fn(),
      getAvailableSubtitles: vi.fn()
    }
    mockOnSubtitleSelected = vi.fn()
    mockOnRetry = vi.fn()
    mockOnSendMessage = vi.fn()
    mockOnExit = vi.fn()
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never)
  })

  afterEach(() => {
    exitSpy.mockRestore()
  })

  const renderChatStateRenderer = (
    machineState: StateFrom<typeof chatWithVideoMachine>,
    messages: ChatMessage[] = [],
    isStreaming = false
  ) => {
    return render(
      <ChatStateRenderer
        url="https://youtube.com/watch?v=test"
        machineState={machineState}
        subtitleService={mockSubtitleService}
        messages={messages}
        isStreaming={isStreaming}
        onSubtitleSelected={mockOnSubtitleSelected}
        onRetry={mockOnRetry}
        onSendMessage={mockOnSendMessage}
        onExit={mockOnExit}
      />
    )
  }

  it('renders subtitle selection for selectingSubtitle', () => {
    const { lastFrame } = renderChatStateRenderer(
      createMachineState('selectingSubtitle')
    )

    expect(lastFrame()).toContain('Select Subtitle')
  })

  it('renders download spinner for downloadingSubtitle', () => {
    const { lastFrame } = renderChatStateRenderer(
      createMachineState('downloadingSubtitle')
    )

    expect(lastFrame()).toContain('Downloading subtitle file...')
  })

  it('renders download error and retries on key press', () => {
    const { lastFrame, stdin } = renderChatStateRenderer(
      createMachineState('downloadError', { error: 'Download failed' })
    )

    expect(lastFrame()).toContain('❌ Failed to download subtitle:')
    expect(lastFrame()).toContain('Download failed')
    expect(lastFrame()).toContain('Press any key to retry.')

    stdin.write('r')

    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('renders initialization spinner for initializingChat', () => {
    const { lastFrame } = renderChatStateRenderer(
      createMachineState('initializingChat', {
        transcript: 'test transcript',
        videoName: 'video'
      })
    )

    expect(lastFrame()).toContain('✅ Transcript downloaded successfully!')
    expect(lastFrame()).toContain('Initializing AI chat service...')
  })

  it('renders chat init error and exits the process', () => {
    const { lastFrame } = renderChatStateRenderer(
      createMachineState('chatInitError', { error: 'Init failed' })
    )

    expect(lastFrame()).toContain('❌ Failed to initialize AI chat service:')
    expect(lastFrame()).toContain('Init failed')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('renders ready message for chatReady', () => {
    const chatService = {
      sendMessage: vi.fn(),
      getMessages: vi.fn(),
      getSystemPrompt: vi.fn()
    } as unknown as ChatService

    const { lastFrame } = renderChatStateRenderer(
      createMachineState('chatReady', {
        transcript: 'test transcript',
        videoName: 'video',
        chatService
      })
    )

    expect(lastFrame()).toContain('🚀 Chat mode ready!')
    expect(lastFrame()).toContain("Type '/help' for available commands.")
  })

  it('renders active chat UI for chatActive', () => {
    const chatService = {
      sendMessage: vi.fn(),
      getMessages: vi.fn(),
      getSystemPrompt: vi.fn()
    } as unknown as ChatService
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: new Date() }
    ]

    const { lastFrame } = renderChatStateRenderer(
      createMachineState('chatActive', {
        transcript: 'test transcript',
        videoName: 'video',
        chatService
      }),
      messages,
      true
    )

    expect(lastFrame()).toContain('Chat Interface - Messages: 1')
    expect(lastFrame()).toContain('Processing...')
  })
})
