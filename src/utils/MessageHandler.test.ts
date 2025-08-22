import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock console.error to avoid test pollution
vi.spyOn(console, 'error').mockImplementation(() => {})
import { MessageHandler } from './MessageHandler.js'
import { ChatMessage, ChatService } from '../services/chat.service.js'

describe('MessageHandler', () => {
  let messageHandler: MessageHandler
  let mockExitHandler: ReturnType<typeof vi.fn>
  let mockTimeoutHandler: ReturnType<typeof vi.fn>
  let mockChatService: ChatService
  let mockOnMessageUpdate: ReturnType<typeof vi.fn>
  let mockOnStreamingUpdate: ReturnType<typeof vi.fn>

  const transcript = 'Test video transcript content'
  const currentMessages: ChatMessage[] = []

  beforeEach(() => {
    mockExitHandler = vi.fn()
    mockTimeoutHandler = vi.fn()
    mockChatService = {
      sendMessage: vi.fn(),
      getMessages: vi.fn(),
      getSystemPrompt: vi.fn()
    } as unknown as ChatService
    mockOnMessageUpdate = vi.fn()
    mockOnStreamingUpdate = vi.fn()

    messageHandler = new MessageHandler(mockExitHandler, mockTimeoutHandler)
  })

  describe('regular message handling', () => {
    it('should handle streaming messages correctly', async () => {
      const message = 'Tell me about the video'

      async function* mockStream() {
        yield 'This'
        yield ' is'
        yield ' a response'
      }

      vi.mocked(mockChatService.sendMessage).mockReturnValue(mockStream())

      await messageHandler.handleMessage(
        message,
        mockChatService,
        transcript,
        currentMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      // Verify streaming started and stopped
      expect(mockOnStreamingUpdate).toHaveBeenCalledWith(true)
      expect(mockOnStreamingUpdate).toHaveBeenCalledWith(false)

      // Verify chat service was called
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(message)

      // Verify message updates were called multiple times - Let's find the right call with full content
      expect(mockOnMessageUpdate).toHaveBeenCalledTimes(6)

      // Find the call that has the complete content
      const callWithFullContent = mockOnMessageUpdate.mock.calls.find(
        call =>
          call[0].length === 2 && call[0][1]?.content === 'This is a response'
      )

      expect(callWithFullContent).toBeDefined()
      expect(callWithFullContent![0]).toBeDefined()
      expect(callWithFullContent![0]).toHaveLength(2)
      expect(callWithFullContent![0][0].content).toBe(message)
      expect(callWithFullContent![0][1].content).toBe('This is a response')

      // Check that the final call has streamingComplete = true
      const finalCall = mockOnMessageUpdate.mock.calls[5][0]
      expect(finalCall[1].streamingComplete).toBe(true)
    })

    it('should handle streaming errors gracefully', async () => {
      const message = 'Tell me about the video'
      const error = new Error('API Error')

      // Mock sendMessage to return a generator that throws
      async function* mockErrorStream() {
        throw error
      }
      vi.mocked(mockChatService.sendMessage).mockReturnValue(mockErrorStream())

      await messageHandler.handleMessage(
        message,
        mockChatService,
        transcript,
        currentMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      // Verify streaming was enabled and then disabled
      expect(mockOnStreamingUpdate).toHaveBeenCalledWith(true)
      expect(mockOnStreamingUpdate).toHaveBeenCalledWith(false)

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Error sending message:',
        error
      )

      // Verify error message was added
      const finalCall =
        mockOnMessageUpdate.mock.calls[
          mockOnMessageUpdate.mock.calls.length - 1
        ][0]
      expect(finalCall).toHaveLength(2)
      expect(finalCall[1].content).toContain('Sorry, I encountered an error')
      expect(finalCall[1].streamingComplete).toBe(true)
    })
  })

  describe('command handling', () => {
    it('should handle help command', async () => {
      await messageHandler.handleMessage(
        '/help',
        mockChatService,
        transcript,
        currentMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      expect(mockChatService.sendMessage).not.toHaveBeenCalled()
      expect(mockOnStreamingUpdate).not.toHaveBeenCalled()

      const finalCall = mockOnMessageUpdate.mock.calls[0][0]
      expect(finalCall).toHaveLength(2)
      expect(finalCall[0].content).toBe('/help')
      expect(finalCall[1].content).toContain('Available commands')
    })

    it('should handle transcript command', async () => {
      await messageHandler.handleMessage(
        '/transcript',
        mockChatService,
        transcript,
        currentMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      const finalCall = mockOnMessageUpdate.mock.calls[0][0]
      expect(finalCall).toHaveLength(2)
      expect(finalCall[1].content).toContain('Full Video Transcript')
      expect(finalCall[1].content).toContain(transcript)
    })

    it('should handle clear command', async () => {
      const existingMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Previous message',
          timestamp: new Date()
        }
      ]

      await messageHandler.handleMessage(
        '/clear',
        mockChatService,
        transcript,
        existingMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      expect(mockOnMessageUpdate).toHaveBeenCalledWith([])
      expect(mockOnMessageUpdate).toHaveBeenCalledTimes(1) // Only called once for clear
    })

    it('should handle exit command', async () => {
      await messageHandler.handleMessage(
        '/exit',
        mockChatService,
        transcript,
        currentMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      const finalCall = mockOnMessageUpdate.mock.calls[0][0]
      expect(finalCall).toHaveLength(2)
      expect(finalCall[1].content).toContain('Goodbye!')

      // Verify exit handler is scheduled
      expect(mockTimeoutHandler).toHaveBeenCalledWith(mockExitHandler, 1000)
    })

    it('should treat invalid commands as regular messages', async () => {
      // Mock a failing stream since /invalidcommand is not a valid command
      // and will be treated as a regular message to the AI
      async function* mockErrorStream() {
        throw new Error('Invalid command not recognized')
      }
      vi.mocked(mockChatService.sendMessage).mockReturnValue(mockErrorStream())

      await messageHandler.handleMessage(
        '/invalidcommand',
        mockChatService,
        transcript,
        currentMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      // Should treat as regular message and call chatService
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        '/invalidcommand'
      )
      expect(mockOnMessageUpdate).toHaveBeenCalled() // Will be called for user message and error handling
    })
  })

  describe('message ID generation', () => {
    it('should generate unique message IDs', async () => {
      const message = 'Test message'

      async function* mockStream() {
        yield 'Response'
      }

      vi.mocked(mockChatService.sendMessage).mockReturnValue(mockStream())

      await messageHandler.handleMessage(
        message,
        mockChatService,
        transcript,
        currentMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      const userMessage = mockOnMessageUpdate.mock.calls[0][0][0]
      const assistantMessage = mockOnMessageUpdate.mock.calls[1][0][1]

      expect(userMessage.id).toMatch(/^msg-\d+-user$/)
      expect(assistantMessage.id).toMatch(/^msg-\d+-assistant$/)
      expect(userMessage.id).not.toBe(assistantMessage.id)
    })
  })

  describe('dependency injection', () => {
    it('should use default handlers when none provided', () => {
      const defaultHandler = new MessageHandler()
      expect(defaultHandler).toBeDefined()
    })

    it('should use injected exit handler', async () => {
      const customExitHandler = vi.fn()
      const customTimeoutHandler = vi.fn()
      const customHandler = new MessageHandler(
        customExitHandler,
        customTimeoutHandler
      )

      await customHandler.handleMessage(
        '/exit',
        mockChatService,
        transcript,
        currentMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      expect(customTimeoutHandler).toHaveBeenCalledWith(customExitHandler, 1000)
    })
  })
})
