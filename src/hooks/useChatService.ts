import { useEffect } from 'react'
import { ChatService } from '../services/chat.service.js'
import { ChatWithVideoState } from './useChatState.js'

type UseChatServiceProps = {
  chatState: ChatWithVideoState
  onChatServiceReady: (transcript: string, chatService: ChatService) => void
  onChatServiceError: (error: Error) => void
  createChatService?: (transcript: string) => Promise<ChatService>
}

const defaultCreateChatService = async (transcript: string): Promise<ChatService> => {
  return new ChatService(transcript)
}

export const useChatService = ({
  chatState,
  onChatServiceReady,
  onChatServiceError,
  createChatService = defaultCreateChatService
}: UseChatServiceProps) => {
  useEffect(() => {
    if (chatState.status !== 'chat-initializing') {
      return
    }

    let isCancelled = false

    const initializeChatService = async () => {
      try {
        const chatService = await createChatService(chatState.transcript)
        
        if (!isCancelled) {
          onChatServiceReady(chatState.transcript, chatService)
        }
      } catch (error) {
        if (!isCancelled) {
          onChatServiceError(error instanceof Error ? error : new Error(String(error)))
        }
      }
    }

    initializeChatService()

    return () => {
      isCancelled = true
    }
  }, [chatState, onChatServiceReady, onChatServiceError, createChatService])
}