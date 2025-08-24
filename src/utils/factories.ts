import { ChatService } from '../services/chat.service.js'
import { MessageHandler } from './MessageHandler.js'
import type { ModelConfiguration } from '../services/model-selection.service.js'

export type ExitHandler = () => void
export type TimeoutHandler = (callback: () => void, delay: number) => void

/**
 * Factory function for creating ChatService instances
 */
export type ChatServiceFactory = (transcript: string, modelConfig?: ModelConfiguration) => Promise<ChatService>

export const createChatService: ChatServiceFactory = async (transcript: string, modelConfig?: ModelConfiguration) => {
  return new ChatService(transcript, modelConfig)
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
  modelConfig?: ModelConfiguration
}

/**
 * Default configuration
 */
export const defaultConfig: Required<Omit<ChatWithVideoConfig, 'modelConfig'>> & Pick<ChatWithVideoConfig, 'modelConfig'> = {
  chatServiceFactory: createChatService,
  messageHandlerFactory: createMessageHandler,
  exitHandler: () => process.exit(0),
  timeoutHandler: (cb, delay) => setTimeout(cb, delay),
  enableAutoTransition: true,
  modelConfig: undefined
}

/**
 * Merges user config with default config
 */
export const mergeConfig = (userConfig: ChatWithVideoConfig = {}): Required<Omit<ChatWithVideoConfig, 'modelConfig'>> & Pick<ChatWithVideoConfig, 'modelConfig'> => {
  return {
    ...defaultConfig,
    ...userConfig
  }
}