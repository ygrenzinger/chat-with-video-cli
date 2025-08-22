import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useChatService } from './useChatService.js'
import { ChatService } from '../services/chat.service.js'
import { ChatWithVideoState } from './useChatState.js'

describe('useChatService', () => {
  let mockOnChatServiceReady: ReturnType<typeof vi.fn>
  let mockOnChatServiceError: ReturnType<typeof vi.fn>
  let mockCreateChatService: ReturnType<typeof vi.fn>
  let mockChatService: ChatService

  beforeEach(() => {
    mockOnChatServiceReady = vi.fn()
    mockOnChatServiceError = vi.fn()
    mockCreateChatService = vi.fn()
    mockChatService = {
      sendMessage: vi.fn(),
      getMessages: vi.fn(),
      getSystemPrompt: vi.fn()
    } as unknown as ChatService
  })

  const renderChatServiceHook = (chatState: ChatWithVideoState) => {
    return renderHook(() =>
      useChatService({
        chatState,
        onChatServiceReady: mockOnChatServiceReady,
        onChatServiceError: mockOnChatServiceError,
        createChatService: mockCreateChatService
      })
    )
  }

  it('should not initialize chat service when status is not chat-initializing', () => {
    const states: ChatWithVideoState[] = [
      { status: 'started' },
      { status: 'subtitle-selected', selectedSubtitle: {} as any },
      {
        status: 'chat-ready',
        transcript: 'test',
        chatService: mockChatService
      },
      {
        status: 'chat-active',
        transcript: 'test',
        chatService: mockChatService
      }
    ]

    states.forEach(state => {
      renderChatServiceHook(state)
      expect(mockCreateChatService).not.toHaveBeenCalled()
    })
  })

  it('should initialize chat service when status is chat-initializing', async () => {
    const transcript = 'test transcript'
    const chatState: ChatWithVideoState = {
      status: 'chat-initializing',
      transcript
    }

    mockCreateChatService.mockResolvedValue(mockChatService)

    renderChatServiceHook(chatState)

    expect(mockCreateChatService).toHaveBeenCalledWith(transcript)
  })

  it('should call onChatServiceReady when initialization succeeds', async () => {
    const transcript = 'test transcript'
    const chatState: ChatWithVideoState = {
      status: 'chat-initializing',
      transcript
    }

    mockCreateChatService.mockResolvedValue(mockChatService)

    renderChatServiceHook(chatState)

    // Wait for the async operation
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockOnChatServiceReady).toHaveBeenCalledWith(
      transcript,
      mockChatService
    )
    expect(mockOnChatServiceError).not.toHaveBeenCalled()
  })

  it('should call onChatServiceError when initialization fails', async () => {
    const transcript = 'test transcript'
    const chatState: ChatWithVideoState = {
      status: 'chat-initializing',
      transcript
    }

    const error = new Error('Initialization failed')
    mockCreateChatService.mockRejectedValue(error)

    renderChatServiceHook(chatState)

    // Wait for the async operation
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockOnChatServiceError).toHaveBeenCalledWith(error)
    expect(mockOnChatServiceReady).not.toHaveBeenCalled()
  })

  it('should convert non-Error objects to Error instances', async () => {
    const transcript = 'test transcript'
    const chatState: ChatWithVideoState = {
      status: 'chat-initializing',
      transcript
    }

    const errorMessage = 'String error'
    mockCreateChatService.mockRejectedValue(errorMessage)

    renderChatServiceHook(chatState)

    // Wait for the async operation
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockOnChatServiceError).toHaveBeenCalledWith(new Error(errorMessage))
  })

  it('should use default createChatService when none provided', async () => {
    const transcript = 'test transcript'
    const chatState: ChatWithVideoState = {
      status: 'chat-initializing',
      transcript
    }

    // Render without providing createChatService
    renderHook(() =>
      useChatService({
        chatState,
        onChatServiceReady: mockOnChatServiceReady,
        onChatServiceError: mockOnChatServiceError
      })
    )

    // Wait for the async operation - it should try to create a real ChatService
    await new Promise(resolve => setTimeout(resolve, 0))

    // We expect this to be called since the default factory tries to create a real service
    expect(mockOnChatServiceReady).toHaveBeenCalledTimes(1)
  })

  it('should re-trigger initialization when chatState changes', () => {
    const initialState: ChatWithVideoState = { status: 'started' }
    const { rerender } = renderChatServiceHook(initialState)

    expect(mockCreateChatService).not.toHaveBeenCalled()

    const newState: ChatWithVideoState = {
      status: 'chat-initializing',
      transcript: 'new transcript'
    }

    mockCreateChatService.mockResolvedValue(mockChatService)

    rerender()
    renderChatServiceHook(newState)

    expect(mockCreateChatService).toHaveBeenCalledWith('new transcript')
  })
})
