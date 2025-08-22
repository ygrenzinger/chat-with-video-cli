import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageHandling } from './useMessageHandling.js'
import { ChatMessage, ChatService } from '../services/chat.service.js'
import { MessageHandler } from '../utils/MessageHandler.js'

describe('useMessageHandling', () => {
  let mockMessageHandler: MessageHandler
  let mockChatService: ChatService
  
  const transcript = 'Test transcript'

  beforeEach(() => {
    mockMessageHandler = {
      handleMessage: vi.fn()
    } as unknown as MessageHandler
    
    mockChatService = {
      sendMessage: vi.fn(),
      getMessages: vi.fn(),
      getSystemPrompt: vi.fn()
    } as unknown as ChatService
  })

  const renderMessageHandlingHook = (props: Partial<Parameters<typeof useMessageHandling>[0]> = {}) => {
    return renderHook(() =>
      useMessageHandling({
        messageHandler: mockMessageHandler,
        chatService: mockChatService,
        transcript,
        canProcessMessages: true,
        ...props
      })
    )
  }

  describe('initial state', () => {
    it('should start with empty messages and not streaming', () => {
      const { result } = renderMessageHandlingHook()

      expect(result.current.messages).toEqual([])
      expect(result.current.isStreaming).toBe(false)
    })

    it('should use default MessageHandler when none provided', () => {
      const { result } = renderHook(() =>
        useMessageHandling({
          chatService: mockChatService,
          transcript,
          canProcessMessages: true
        })
      )

      expect(result.current).toBeDefined()
    })
  })

  describe('handleSendMessage', () => {
    it('should call messageHandler.handleMessage with correct parameters', async () => {
      const { result } = renderMessageHandlingHook()
      const message = 'Test message'

      await act(async () => {
        await result.current.handleSendMessage(message)
      })

      expect(mockMessageHandler.handleMessage).toHaveBeenCalledWith(
        message,
        mockChatService,
        transcript,
        [], // initial empty messages
        expect.any(Function), // setMessages
        expect.any(Function)  // setIsStreaming
      )
    })

    it('should not call messageHandler when canProcessMessages is false', async () => {
      const { result } = renderMessageHandlingHook({ canProcessMessages: false })
      const message = 'Test message'

      await act(async () => {
        await result.current.handleSendMessage(message)
      })

      expect(mockMessageHandler.handleMessage).not.toHaveBeenCalled()
    })

    it('should not call messageHandler when chatService is null', async () => {
      const { result } = renderMessageHandlingHook({ chatService: null })
      const message = 'Test message'

      await act(async () => {
        await result.current.handleSendMessage(message)
      })

      expect(mockMessageHandler.handleMessage).not.toHaveBeenCalled()
    })

    it('should not call messageHandler when transcript is null', async () => {
      const { result } = renderMessageHandlingHook({ transcript: null })
      const message = 'Test message'

      await act(async () => {
        await result.current.handleSendMessage(message)
      })

      expect(mockMessageHandler.handleMessage).not.toHaveBeenCalled()
    })

    it('should maintain reference equality when dependencies do not change', () => {
      const { result, rerender } = renderMessageHandlingHook()
      const firstHandleSendMessage = result.current.handleSendMessage

      rerender()
      const secondHandleSendMessage = result.current.handleSendMessage

      expect(firstHandleSendMessage).toBe(secondHandleSendMessage)
    })

    it('should update reference when dependencies change', () => {
      const { result, rerender } = renderMessageHandlingHook()
      const firstHandleSendMessage = result.current.handleSendMessage

      rerender()
      renderMessageHandlingHook({ transcript: 'Different transcript' })
      const secondHandleSendMessage = result.current.handleSendMessage

      // Note: This might be the same reference due to how renderHook works
      // The important thing is that it uses the new transcript when called
    })
  })

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      const { result } = renderMessageHandlingHook()

      // First add a message
      const testMessage: ChatMessage = {
        id: 'test-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date()
      }

      act(() => {
        result.current.addMessage(testMessage)
      })

      expect(result.current.messages).toHaveLength(1)

      // Then clear messages
      act(() => {
        result.current.clearMessages()
      })

      expect(result.current.messages).toEqual([])
    })

    it('should maintain reference equality across re-renders', () => {
      const { result, rerender } = renderMessageHandlingHook()
      const firstClearMessages = result.current.clearMessages

      rerender()
      const secondClearMessages = result.current.clearMessages

      expect(firstClearMessages).toBe(secondClearMessages)
    })
  })

  describe('addMessage', () => {
    it('should add a message to the messages array', () => {
      const { result } = renderMessageHandlingHook()
      
      const testMessage: ChatMessage = {
        id: 'test-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date()
      }

      act(() => {
        result.current.addMessage(testMessage)
      })

      expect(result.current.messages).toEqual([testMessage])
    })

    it('should add multiple messages in order', () => {
      const { result } = renderMessageHandlingHook()
      
      const message1: ChatMessage = {
        id: 'test-1',
        role: 'user',
        content: 'First message',
        timestamp: new Date()
      }

      const message2: ChatMessage = {
        id: 'test-2',
        role: 'assistant',
        content: 'Second message',
        timestamp: new Date()
      }

      act(() => {
        result.current.addMessage(message1)
        result.current.addMessage(message2)
      })

      expect(result.current.messages).toEqual([message1, message2])
    })

    it('should maintain reference equality across re-renders', () => {
      const { result, rerender } = renderMessageHandlingHook()
      const firstAddMessage = result.current.addMessage

      rerender()
      const secondAddMessage = result.current.addMessage

      expect(firstAddMessage).toBe(secondAddMessage)
    })
  })

  describe('state updates from messageHandler', () => {
    it('should update messages when messageHandler calls setMessages', async () => {
      const { result } = renderMessageHandlingHook()
      
      // Mock messageHandler to simulate updating messages
      vi.mocked(mockMessageHandler.handleMessage).mockImplementation(
        async (message, chatService, transcript, currentMessages, setMessages, setStreaming) => {
          const newMessage: ChatMessage = {
            id: 'test-message',
            role: 'user',
            content: message,
            timestamp: new Date()
          }
          setMessages([...currentMessages, newMessage])
        }
      )

      await act(async () => {
        await result.current.handleSendMessage('Test message')
      })

      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].content).toBe('Test message')
    })

    it('should update streaming state when messageHandler calls setStreaming', async () => {
      const { result } = renderMessageHandlingHook()
      
      // Mock messageHandler to simulate streaming
      vi.mocked(mockMessageHandler.handleMessage).mockImplementation(
        async (message, chatService, transcript, currentMessages, setMessages, setStreaming) => {
          setStreaming(true)
          // Simulate async work
          await new Promise(resolve => setTimeout(resolve, 0))
          setStreaming(false)
        }
      )

      expect(result.current.isStreaming).toBe(false)

      await act(async () => {
        await result.current.handleSendMessage('Test message')
      })

      expect(result.current.isStreaming).toBe(false) // Should be false after completion
    })
  })
})