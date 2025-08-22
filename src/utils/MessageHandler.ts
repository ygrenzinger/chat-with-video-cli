import { ChatMessage, ChatService } from '../services/chat.service.js'
import { parseCommand, isCommand, getHelpText } from './chat-commands.js'

export type ExitHandler = () => void

export class MessageHandler {
  constructor(
    private exitHandler: ExitHandler = () => process.exit(0),
    private timeoutHandler: (callback: () => void, delay: number) => void = (
      cb,
      delay
    ) => setTimeout(cb, delay)
  ) {}

  async handleMessage(
    message: string,
    chatService: ChatService,
    transcript: string,
    currentMessages: ChatMessage[],
    onMessageUpdate: (messages: ChatMessage[]) => void,
    onStreamingUpdate: (isStreaming: boolean) => void
  ): Promise<void> {
    // Check if it's a command
    if (isCommand(message)) {
      await this.handleCommand(
        message,
        transcript,
        currentMessages,
        onMessageUpdate
      )
      return
    }

    onStreamingUpdate(true)

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    const updatedMessages = [...currentMessages, userMessage]
    onMessageUpdate(updatedMessages)

    try {
      let assistantContent = ''
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streamingComplete: false
      }

      const messagesWithAssistant = [...updatedMessages, assistantMessage]
      onMessageUpdate(messagesWithAssistant)

      for await (const textPart of chatService.sendMessage(message)) {
        assistantContent += textPart
        const updatedMessagesWithStream = messagesWithAssistant.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: assistantContent }
            : msg
        )
        onMessageUpdate(updatedMessagesWithStream)
      }

      const finalMessages = messagesWithAssistant.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, content: assistantContent, streamingComplete: true }
          : msg
      )
      onMessageUpdate(finalMessages)
    } catch (error) {
      console.error('Error sending message:', error)

      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content:
          'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
        streamingComplete: true
      }

      // Replace the incomplete assistant message with error message
      const errorMessages = [...updatedMessages, errorMessage]
      onMessageUpdate(errorMessages)
    } finally {
      onStreamingUpdate(false)
    }
  }

  private async handleCommand(
    command: string,
    transcript: string,
    currentMessages: ChatMessage[],
    onMessageUpdate: (messages: ChatMessage[]) => void
  ): Promise<void> {
    const parsedCommand = parseCommand(command)
    if (!parsedCommand) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: command,
      timestamp: new Date()
    }

    const updatedMessages = [...currentMessages, userMessage]

    let responseContent = ''
    switch (parsedCommand.type) {
      case 'help':
        responseContent = getHelpText()
        break
      case 'transcript':
        responseContent = `Full Video Transcript:\n\n${transcript}`
        break
      case 'clear':
        onMessageUpdate([]) // Clear all messages
        return // Don't add response message for clear
      case 'exit':
        responseContent = 'Goodbye! 👋'
        break
    }

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      streamingComplete: true
    }

    const finalMessages = [...updatedMessages, assistantMessage]
    onMessageUpdate(finalMessages)

    // Handle exit command
    if (parsedCommand.type === 'exit') {
      this.timeoutHandler(this.exitHandler, 1000)
    }
  }
}
