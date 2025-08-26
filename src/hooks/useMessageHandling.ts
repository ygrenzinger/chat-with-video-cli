import { useState, useCallback } from 'react'
import { ChatMessage, ChatService } from '../services/chat.service.js'
import { MessageHandler } from '../utils/MessageHandler.js'

type UseMessageHandlingProps = {
  messageHandler?: MessageHandler
  chatService: ChatService | null
  transcript: string | null
  videoName: string | null
  canProcessMessages: boolean
}

export const useMessageHandling = ({
  messageHandler = new MessageHandler(),
  chatService,
  transcript,
  videoName,
  canProcessMessages
}: UseMessageHandlingProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!canProcessMessages || !chatService || !transcript || !videoName) {
        return
      }

      await messageHandler.handleMessage(
        message,
        chatService,
        transcript,
        videoName,
        messages,
        setMessages,
        setIsStreaming
      )
    },
    [
      canProcessMessages,
      chatService,
      transcript,
      messages,
      messageHandler,
      videoName
    ]
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
