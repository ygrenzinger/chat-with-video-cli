import { describe, it, expect, vi } from 'vitest'
import {
  createChatService,
  createMessageHandler,
  mergeConfig,
  defaultConfig,
  type ChatWithVideoConfig
} from './factories.js'
import { ChatService } from '../services/chat.service.js'
import { MessageHandler } from './MessageHandler.js'

describe('factories', () => {
  process.env.ANTHROPIC_API_KEY = 'test-key'

  describe('createChatService', () => {
    it('should create a ChatService instance with transcript', async () => {
      const transcript = 'Test transcript'
      const chatService = await createChatService(transcript)

      expect(chatService).toBeInstanceOf(ChatService)
    })
  })

  describe('createMessageHandler', () => {
    it('should create a MessageHandler with default handlers', () => {
      const messageHandler = createMessageHandler()

      expect(messageHandler).toBeInstanceOf(MessageHandler)
    })

    it('should create a MessageHandler with custom handlers', () => {
      const mockExitHandler = vi.fn()
      const mockTimeoutHandler = vi.fn()

      const messageHandler = createMessageHandler(
        mockExitHandler,
        mockTimeoutHandler
      )

      expect(messageHandler).toBeInstanceOf(MessageHandler)
    })

    it('should use default handlers when not provided', () => {
      const messageHandler = createMessageHandler()

      expect(messageHandler).toBeInstanceOf(MessageHandler)
    })
  })

  describe('defaultConfig', () => {
    it('should have all required properties', () => {
      expect(defaultConfig).toHaveProperty('chatServiceFactory')
      expect(defaultConfig).toHaveProperty('messageHandlerFactory')
      expect(defaultConfig).toHaveProperty('exitHandler')
      expect(defaultConfig).toHaveProperty('timeoutHandler')
      expect(defaultConfig).toHaveProperty('enableAutoTransition')

      expect(typeof defaultConfig.chatServiceFactory).toBe('function')
      expect(typeof defaultConfig.messageHandlerFactory).toBe('function')
      expect(typeof defaultConfig.exitHandler).toBe('function')
      expect(typeof defaultConfig.timeoutHandler).toBe('function')
      expect(typeof defaultConfig.enableAutoTransition).toBe('boolean')
    })

    it('should have enableAutoTransition set to true', () => {
      expect(defaultConfig.enableAutoTransition).toBe(true)
    })
  })

  describe('mergeConfig', () => {
    it('should return default config when no user config provided', () => {
      const merged = mergeConfig()

      expect(merged).toEqual(defaultConfig)
    })

    it('should return default config when empty user config provided', () => {
      const merged = mergeConfig({})

      expect(merged).toEqual(defaultConfig)
    })

    it('should merge user config with defaults', () => {
      const mockChatServiceFactory = vi.fn()
      const mockExitHandler = vi.fn()

      const userConfig: ChatWithVideoConfig = {
        chatServiceFactory: mockChatServiceFactory,
        exitHandler: mockExitHandler,
        enableAutoTransition: false
      }

      const merged = mergeConfig(userConfig)

      expect(merged.chatServiceFactory).toBe(mockChatServiceFactory)
      expect(merged.exitHandler).toBe(mockExitHandler)
      expect(merged.enableAutoTransition).toBe(false)

      // Should keep defaults for unspecified properties
      expect(merged.messageHandlerFactory).toBe(
        defaultConfig.messageHandlerFactory
      )
      expect(merged.timeoutHandler).toBe(defaultConfig.timeoutHandler)
    })

    it('should override all properties when provided', () => {
      const mockChatServiceFactory = vi.fn()
      const mockMessageHandlerFactory = vi.fn()
      const mockExitHandler = vi.fn()
      const mockTimeoutHandler = vi.fn()

      const userConfig: ChatWithVideoConfig = {
        chatServiceFactory: mockChatServiceFactory,
        messageHandlerFactory: mockMessageHandlerFactory,
        exitHandler: mockExitHandler,
        timeoutHandler: mockTimeoutHandler,
        enableAutoTransition: false
      }

      const merged = mergeConfig(userConfig)

      expect(merged.chatServiceFactory).toBe(mockChatServiceFactory)
      expect(merged.messageHandlerFactory).toBe(mockMessageHandlerFactory)
      expect(merged.exitHandler).toBe(mockExitHandler)
      expect(merged.timeoutHandler).toBe(mockTimeoutHandler)
      expect(merged.enableAutoTransition).toBe(false)
    })

    it('should handle partial config objects', () => {
      const userConfig: ChatWithVideoConfig = {
        enableAutoTransition: false
      }

      const merged = mergeConfig(userConfig)

      expect(merged.enableAutoTransition).toBe(false)
      expect(merged.chatServiceFactory).toBe(defaultConfig.chatServiceFactory)
      expect(merged.messageHandlerFactory).toBe(
        defaultConfig.messageHandlerFactory
      )
      expect(merged.exitHandler).toBe(defaultConfig.exitHandler)
      expect(merged.timeoutHandler).toBe(defaultConfig.timeoutHandler)
    })
  })

  describe('integration', () => {
    it('should allow factories to work together', async () => {
      const config = mergeConfig()

      // Test that the factories can create instances
      const transcript = 'Test transcript'
      const chatService = await config.chatServiceFactory(transcript)
      const messageHandler = config.messageHandlerFactory()

      expect(chatService).toBeInstanceOf(ChatService)
      expect(messageHandler).toBeInstanceOf(MessageHandler)
    })

    it('should work with custom factories', async () => {
      const mockChatService = { test: 'mock' } as unknown
      const mockMessageHandler = { test: 'mock' } as unknown

      const customConfig = mergeConfig({
        chatServiceFactory: vi.fn().mockResolvedValue(mockChatService),
        messageHandlerFactory: vi.fn().mockReturnValue(mockMessageHandler)
      })

      const chatService = await customConfig.chatServiceFactory('test')
      const messageHandler = customConfig.messageHandlerFactory()

      expect(chatService).toBe(mockChatService)
      expect(messageHandler).toBe(mockMessageHandler)
      expect(customConfig.chatServiceFactory).toHaveBeenCalledWith('test')
      expect(customConfig.messageHandlerFactory).toHaveBeenCalled()
    })
  })
})
