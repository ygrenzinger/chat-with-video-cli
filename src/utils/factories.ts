import { ChatService } from '../services/chat.service.js'
import { MessageHandler } from './MessageHandler.js'

export type ExitHandler = () => void
export type TimeoutHandler = (callback: () => void, delay: number) => void

/**
 * Factory function for creating ChatService instances
 */
export type ChatServiceFactory = (transcript: string) => Promise<ChatService>

export const createChatService: ChatServiceFactory = async (transcript: string) => {
  return new ChatService(transcript)
}

/**
 * Factory function for creating MessageHandler instances
 */
export type MessageHandlerFactory = (
  exitHandler?: ExitHandler,
  timeoutHandler?: TimeoutHandler
) => MessageHandler

export const createMessageHandler: MessageHandlerFactory = (
  exitHandler = () => process.exit(0),
  timeoutHandler = (cb, delay) => setTimeout(cb, delay)
) => {
  return new MessageHandler(exitHandler, timeoutHandler)
}

/**
 * Configuration object for customizable behaviors
 */
export interface ChatWithVideoConfig {
  chatServiceFactory?: ChatServiceFactory
  messageHandlerFactory?: MessageHandlerFactory
  exitHandler?: ExitHandler
  timeoutHandler?: TimeoutHandler
  enableAutoTransition?: boolean
}

/**
 * Default configuration
 */
export const defaultConfig: Required<ChatWithVideoConfig> = {
  chatServiceFactory: createChatService,
  messageHandlerFactory: createMessageHandler,
  exitHandler: () => process.exit(0),
  timeoutHandler: (cb, delay) => setTimeout(cb, delay),
  enableAutoTransition: true
}

/**
 * Merges user config with default config
 */
export const mergeConfig = (userConfig: ChatWithVideoConfig = {}): Required<ChatWithVideoConfig> => {
  return {
    ...defaultConfig,
    ...userConfig
  }
}