import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock clipboardy
vi.mock('copy-paste/promises', () => ({
  copy: vi.fn()
}))

// Mock console.error to avoid test pollution
vi.spyOn(console, 'error').mockImplementation(() => {})
import { MessageHandler } from './MessageHandler.js'
import { ChatMessage, ChatService } from '../services/chat.service.js'
import { copy } from 'copy-paste/promises'

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

  afterEach(() => {
    vi.resetAllMocks()
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
      const throwError = () => {
        throw error
      }
      async function* mockErrorStream() {
        yield throwError()
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

    it('should handle copy-last command with existing assistant message', async () => {
      const existingMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'User message',
          timestamp: new Date()
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Assistant response to copy',
          timestamp: new Date()
        }
      ]

      await messageHandler.handleMessage(
        '/copy-last',
        mockChatService,
        transcript,
        existingMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      expect(copy).toHaveBeenCalledWith('Assistant response to copy')
      const finalCall = mockOnMessageUpdate.mock.calls[0][0]
      expect(finalCall).toHaveLength(4) // 2 existing + User command + Assistant response
      expect(finalCall[0].content).toBe('User message') // First existing message
      expect(finalCall[1].content).toBe('Assistant response to copy') // Second existing message
      expect(finalCall[2].content).toBe('/copy-last') // User command
      expect(finalCall[3].content).toBe(
        'Last assistant message copied to clipboard! ✓'
      ) // Command response
    })

    it('should handle copy-last command with no assistant messages', async () => {
      const existingMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'User message',
          timestamp: new Date()
        }
      ]

      await messageHandler.handleMessage(
        '/copy-last',
        mockChatService,
        transcript,
        existingMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      expect(copy).not.toHaveBeenCalled()
      const finalCall = mockOnMessageUpdate.mock.calls[0][0]
      expect(finalCall).toHaveLength(3) // 1 existing + User command + Assistant response
      expect(finalCall[0].content).toBe('User message') // Existing message
      expect(finalCall[1].content).toBe('/copy-last') // User command
      expect(finalCall[2].content).toBe('No assistant message found to copy.') // Command response
    })

    it('should handle copy-last command when clipboard fails', async () => {
      const existingMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Assistant message',
          timestamp: new Date()
        }
      ]

      // Make writeSync throw an error
      vi.mocked(copy).mockImplementationOnce(() => {
        throw new Error('Clipboard error')
      })

      await messageHandler.handleMessage(
        '/copy-last',
        mockChatService,
        transcript,
        existingMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      expect(console.error).toHaveBeenCalledWith(
        'Error copying to clipboard:',
        expect.any(Error)
      )
      const finalCall = mockOnMessageUpdate.mock.calls[0][0]
      expect(finalCall).toHaveLength(3) // 1 existing + User command + Assistant response
      expect(finalCall[0].content).toBe('Assistant message') // Existing message
      expect(finalCall[1].content).toBe('/copy-last') // User command
      expect(finalCall[2].content).toBe(
        'Failed to copy message to clipboard. Please try again.'
      ) // Command response
    })

    it('should find the last assistant message from multiple', async () => {
      const existingMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'First assistant message',
          timestamp: new Date()
        },
        {
          id: 'msg-2',
          role: 'user',
          content: 'User message',
          timestamp: new Date()
        },
        {
          id: 'msg-3',
          role: 'assistant',
          content: 'Last assistant message',
          timestamp: new Date()
        }
      ]

      await messageHandler.handleMessage(
        '/copy-last',
        mockChatService,
        transcript,
        existingMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      expect(copy).toHaveBeenCalledWith('Last assistant message')
    })

    it('should handle copy-all command with existing messages', async () => {
      const existingMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello there',
          timestamp: new Date()
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi! How can I help you?',
          timestamp: new Date()
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'Tell me about this video',
          timestamp: new Date()
        }
      ]

      await messageHandler.handleMessage(
        '/copy-all',
        mockChatService,
        transcript,
        existingMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      const expectedFormat = 'user\nHello there\n\n\nassistant\nHi! How can I help you?\n\n\nuser\nTell me about this video'
      expect(copy).toHaveBeenCalledWith(expectedFormat)
      
      const finalCall = mockOnMessageUpdate.mock.calls[0][0]
      expect(finalCall).toHaveLength(5) // 3 existing + User command + Assistant response
      expect(finalCall[3].content).toBe('/copy-all') // User command
      expect(finalCall[4].content).toBe('Full chat history copied to clipboard! ✓') // Command response
    })

    it('should handle copy-all command with no messages', async () => {
      const existingMessages: ChatMessage[] = []

      await messageHandler.handleMessage(
        '/copy-all',
        mockChatService,
        transcript,
        existingMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      expect(copy).not.toHaveBeenCalled()
      const finalCall = mockOnMessageUpdate.mock.calls[0][0]
      expect(finalCall).toHaveLength(2) // User command + Assistant response
      expect(finalCall[0].content).toBe('/copy-all') // User command
      expect(finalCall[1].content).toBe('No messages found to copy.') // Command response
    })

    it('should handle copy-all command when clipboard fails', async () => {
      const existingMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test message',
          timestamp: new Date()
        }
      ]

      // Make copy throw an error
      vi.mocked(copy).mockImplementationOnce(() => {
        throw new Error('Clipboard error')
      })

      await messageHandler.handleMessage(
        '/copy-all',
        mockChatService,
        transcript,
        existingMessages,
        mockOnMessageUpdate,
        mockOnStreamingUpdate
      )

      expect(console.error).toHaveBeenCalledWith(
        'Error copying to clipboard:',
        expect.any(Error)
      )
      const finalCall = mockOnMessageUpdate.mock.calls[0][0]
      expect(finalCall).toHaveLength(3) // 1 existing + User command + Assistant response
      expect(finalCall[0].content).toBe('Test message') // Existing message
      expect(finalCall[1].content).toBe('/copy-all') // User command
      expect(finalCall[2].content).toBe(
        'Failed to copy chat history to clipboard. Please try again.'
      ) // Command response
    })

    it('should treat invalid commands as regular messages', async () => {
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
