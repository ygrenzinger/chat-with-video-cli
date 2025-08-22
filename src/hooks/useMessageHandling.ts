import { useState, useCallback } from 'react'
import { ChatMessage, ChatService } from '../services/chat.service.js'
import { MessageHandler } from '../utils/MessageHandler.js'

type UseMessageHandlingProps = {
  messageHandler?: MessageHandler
  chatService: ChatService | null
  transcript: string | null
  canProcessMessages: boolean
}

export const useMessageHandling = ({
  messageHandler = new MessageHandler(),
  chatService,
  transcript,
  canProcessMessages
}: UseMessageHandlingProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!canProcessMessages || !chatService || !transcript) {
        return
      }

      await messageHandler.handleMessage(
        message,
        chatService,
        transcript,
        messages,
        setMessages,
        setIsStreaming
      )
    },
    [canProcessMessages, chatService, transcript, messages, messageHandler]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  return {
    messages,
    isStreaming,
    handleSendMessage,
    clearMessages,
    addMessage
  }
}