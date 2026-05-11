import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { ChatWithVideo } from './ChatWithVideo.js'
import { type SubtitleService } from '../services/subtitle.js'
import { type ChatWithVideoConfig } from '../utils/factories.js'

vi.mock('../hooks/useChatMachine.js', () => ({
  useChatMachine: vi.fn()
}))

vi.mock('../hooks/useMessageHandling.js', () => ({
  useMessageHandling: vi.fn()
}))

vi.mock('./ChatStateRenderer.js', () => ({
  ChatStateRenderer: ({ machineState }: any) => (
    <Text>State: {String(machineState.value)}</Text>
  )
}))

vi.mock('../utils/factories.js', () => ({
  mergeConfig: vi.fn()
}))

import { useChatMachine } from '../hooks/useChatMachine.js'
import { useMessageHandling } from '../hooks/useMessageHandling.js'
import { mergeConfig } from '../utils/factories.js'

const createMachineState = (value: string, context = {}) =>
  ({
    value,
    context: {
      url: 'https://youtube.com/watch?v=test',
      selectedSubtitle: null,
      transcript: null,
      videoName: null,
      chatService: null,
      error: null,
      ...context
    },
    matches: (state: string) => state === value
  }) as any

describe('ChatWithVideo', () => {
  let mockSubtitleService: SubtitleService
  let mockUseChatMachine: ReturnType<typeof vi.fn>
  let mockUseMessageHandling: ReturnType<typeof vi.fn>
  let mockMergeConfig: ReturnType<typeof vi.fn>

  const url = 'https://youtube.com/watch?v=test'

  beforeEach(() => {
    vi.clearAllMocks()

    mockSubtitleService = {
      isAvailable: vi.fn(),
      retrieveRawText: vi.fn(),
      getAvailableSubtitles: vi.fn()
    }

    mockUseChatMachine = vi.mocked(useChatMachine)
    mockUseMessageHandling = vi.mocked(useMessageHandling)
    mockMergeConfig = vi.mocked(mergeConfig)

    mockUseChatMachine.mockReturnValue({
      state: createMachineState('selectingSubtitle'),
      send: vi.fn(),
      context: createMachineState('selectingSubtitle').context,
      isSelectingSubtitle: true,
      isDownloading: false,
      isDownloadError: false,
      isInitializingChat: false,
      isChatInitError: false,
      isChatActive: false
    })

    mockUseMessageHandling.mockReturnValue({
      messages: [],
      isStreaming: false,
      handleSendMessage: vi.fn(),
      clearMessages: vi.fn(),
      addMessage: vi.fn()
    })

    mockMergeConfig.mockReturnValue({
      chatServiceFactory: vi.fn(),
      messageHandlerFactory: vi.fn().mockReturnValue({}),
      exitHandler: vi.fn(),
      timeoutHandler: vi.fn(),
      enableAutoTransition: true,
      modelConfig: undefined
    })
  })

  it('renders without crashing', () => {
    const { lastFrame } = render(
      <ChatWithVideo url={url} subtitleService={mockSubtitleService} />
    )

    expect(lastFrame()).toBeDefined()
  })

  it('merges configuration with defaults', () => {
    const customConfig: ChatWithVideoConfig = {
      enableAutoTransition: false,
      exitHandler: vi.fn()
    }

    render(
      <ChatWithVideo
        url={url}
        subtitleService={mockSubtitleService}
        config={customConfig}
      />
    )

    expect(mockMergeConfig).toHaveBeenCalledWith(customConfig)
  })

  it('initializes useChatMachine with the configured chat service factory', async () => {
    const baseFactory = vi.fn().mockResolvedValue({ test: 'chat-service' })
    const modelConfig = { model: { provider: 'fake' } }

    mockMergeConfig.mockReturnValue({
      chatServiceFactory: baseFactory,
      messageHandlerFactory: vi.fn().mockReturnValue({}),
      exitHandler: vi.fn(),
      timeoutHandler: vi.fn(),
      enableAutoTransition: true,
      modelConfig
    })

    render(<ChatWithVideo url={url} subtitleService={mockSubtitleService} />)

    expect(mockUseChatMachine).toHaveBeenCalledWith(
      url,
      mockSubtitleService,
      expect.any(Function)
    )

    const configuredFactory = mockUseChatMachine.mock.calls[0][2]
    await configuredFactory(url, 'transcript')

    expect(baseFactory).toHaveBeenCalledWith(url, 'transcript', modelConfig)
  })

  it('configures useMessageHandling from machine context', () => {
    const chatService = { test: 'chat-service' }

    mockUseChatMachine.mockReturnValue({
      state: createMachineState('chatActive', {
        transcript: 'transcript',
        videoName: 'video',
        chatService
      }),
      send: vi.fn(),
      context: {
        url,
        selectedSubtitle: null,
        transcript: 'transcript',
        videoName: 'video',
        chatService,
        error: null
      },
      isSelectingSubtitle: false,
      isDownloading: false,
      isDownloadError: false,
      isInitializingChat: false,
      isChatInitError: false,
      isChatActive: true
    })

    render(<ChatWithVideo url={url} subtitleService={mockSubtitleService} />)

    expect(mockUseMessageHandling).toHaveBeenCalledWith({
      messageHandler: {},
      chatService,
      transcript: 'transcript',
      canProcessMessages: true,
      videoName: 'video'
    })
  })
})
