import { randomUUID } from 'node:crypto'
import { ChatMessage, ChatService } from '../services/chat.service.js'
import { parseCommand, getHelpText, type ChatCommand } from './chat-commands.js'
import { copy } from 'copy-paste/promises.js'
import { writeFileSync } from 'fs'

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
    videoName: string,
    currentMessages: ChatMessage[],
    onMessageUpdate: (messages: ChatMessage[]) => void,
    onStreamingUpdate: (isStreaming: boolean) => void
  ): Promise<void> {
    // Check if it's a command (valid or unknown)
    const parsedCommand = parseCommand(message)
    if (parsedCommand) {
      await this.handleCommand(
        message,
        chatService,
        transcript,
        currentMessages,
        onMessageUpdate,
        onStreamingUpdate,
        videoName,
        parsedCommand
      )
      return
    }

    await this.streamChatResponse(
      message,
      chatService,
      currentMessages,
      onMessageUpdate,
      onStreamingUpdate
    )
    return
  }

  private async streamChatResponse(
    query: string,
    chatService: ChatService,
    currentMessages: ChatMessage[],
    onMessageUpdate: (messages: ChatMessage[]) => void,
    onStreamingUpdate: (isStreaming: boolean) => void
  ): Promise<void> {
    const hasUserMessage = currentMessages.at(-1)?.role === 'user'
    const userMessage = hasUserMessage
      ? null
      : {
          id: `msg-${randomUUID()}-user`,
          role: 'user' as const,
          content: query,
          timestamp: new Date()
        }

    const messagesWithUser = userMessage
      ? [...currentMessages, userMessage]
      : currentMessages

    onMessageUpdate(messagesWithUser)
    onStreamingUpdate(true)

    try {
      let assistantContent = ''
      const assistantMessage: ChatMessage = {
        id: `msg-${randomUUID()}-assistant`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streamingComplete: false
      }

      const messagesWithAssistant = [...messagesWithUser, assistantMessage]
      onMessageUpdate(messagesWithAssistant)

      for await (const textPart of chatService.sendMessage(query)) {
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
      const isSummaryQuery =
        query ===
        'give me a detailed summary of each topic addressed in this video'
      console.error(
        isSummaryQuery ? 'Error getting summary:' : 'Error sending message:',
        error
      )

      const errorMessage: ChatMessage = {
        id: `msg-${randomUUID()}-error`,
        role: 'assistant',
        content: isSummaryQuery
          ? 'Sorry, I encountered an error getting the summary. Please try again.'
          : 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
        streamingComplete: true
      }

      const errorMessages = [...messagesWithUser, errorMessage]
      onMessageUpdate(errorMessages)
    } finally {
      onStreamingUpdate(false)
    }
  }

  private async handleCommand(
    command: string,
    chatService: ChatService,
    transcript: string,
    currentMessages: ChatMessage[],
    onMessageUpdate: (messages: ChatMessage[]) => void,
    onStreamingUpdate: (isStreaming: boolean) => void,
    videoName?: string,
    parsedCommand?: ChatCommand | null
  ): Promise<void> {
    if (!parsedCommand) {
      parsedCommand = parseCommand(command)
    }
    if (!parsedCommand) return

    const userMessage: ChatMessage = {
      id: `msg-${randomUUID()}-user`,
      role: 'user',
      content: command,
      timestamp: new Date()
    }

    const messagesWithCommand = [...currentMessages, userMessage]

    let responseContent = ''
    switch (parsedCommand.type) {
      case 'help':
        responseContent = getHelpText()
        break
      case 'transcript':
        responseContent = `Full Video Transcript:\n\n${transcript}`
        break
      case 'clear':
        chatService.clearMessages()
        onMessageUpdate([]) // Clear all messages
        return // Don't add response message for clear
      case 'copy-last': {
        // Find the last assistant message
        const assistantMessages = currentMessages.filter(
          msg => msg.role === 'assistant'
        )

        if (assistantMessages.length == 0) {
          responseContent = 'No assistant message found to copy.'
        } else {
          try {
            const lastMessage =
              assistantMessages[assistantMessages.length - 1].content
            await copy(lastMessage)
            responseContent = 'Last assistant message copied to clipboard! ✓'
          } catch (error) {
            console.error('Error copying to clipboard:', error)
            responseContent =
              'Failed to copy message to clipboard. Please try again.'
          }
        }
        break
      }
      case 'copy-all': {
        if (currentMessages.length === 0) {
          responseContent = 'No messages found to copy.'
        } else {
          try {
            const formattedChat = currentMessages
              .map(msg => `${msg.role}\n${msg.content}`)
              .join('\n\n\n')
            await copy(formattedChat)
            responseContent = 'Full chat history copied to clipboard! ✓'
          } catch (error) {
            console.error('Error copying to clipboard:', error)
            responseContent =
              'Failed to copy chat history to clipboard. Please try again.'
          }
        }
        break
      }
      case 'save-to-file': {
        if (currentMessages.length === 0) {
          responseContent = 'No messages found to save.'
        } else {
          try {
            // Generate filename
            const sanitizedVideoName = this.sanitizeFilename(
              videoName || 'unknown-video'
            )
            const filename = `${sanitizedVideoName}-${this.formatTimestamp()}.chat.md`

            // Format chat as markdown
            const formattedChat = this.formatChatAsMarkdown(
              currentMessages,
              videoName
            )

            // Write to file
            writeFileSync(filename, formattedChat, 'utf8')
            responseContent = `Chat history saved to ${filename} ✓`
          } catch (error) {
            console.error('Error saving chat to file:', error)
            responseContent =
              'Failed to save chat history to file. Please try again.'
          }
        }
        break
      }
      case 'exit':
        responseContent = 'Goodbye! 👋'
        break
      case 'summary': {
        const summaryQuery =
          'give me a detailed summary of each topic addressed in this video'

        await this.streamChatResponse(
          summaryQuery,
          chatService,
          messagesWithCommand,
          onMessageUpdate,
          onStreamingUpdate
        )
        return
      }
      case 'unknown':
        responseContent = `Unknown command: ${parsedCommand.command}. Type /help for available commands.`
        break
    }

    const assistantMessage: ChatMessage = {
      id: `msg-${randomUUID()}-assistant`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      streamingComplete: true
    }

    const finalMessages = [...messagesWithCommand, assistantMessage]
    onMessageUpdate(finalMessages)

    // Handle exit command
    if (parsedCommand.type === 'exit') {
      this.timeoutHandler(this.exitHandler, 1000)
    }
  }

  private sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters for filenames
    return filename
      .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
      .replace(/\s+/g, '-') // Replace spaces with dash
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .toLowerCase()
  }

  private formatTimestamp(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `${year}${month}${day}-${hours}${minutes}${seconds}`
  }

  private formatChatAsMarkdown(
    messages: ChatMessage[],
    videoName?: string
  ): string {
    const currentDate = new Date().toLocaleString()
    const title = videoName
      ? `Chat with Video: ${videoName}`
      : 'Chat with Video'

    let markdown = `# ${title}\n\n`
    markdown += `*Generated on: ${currentDate}*\n\n`
    markdown += '---\n\n'

    for (const message of messages) {
      const roleHeader = message.role === 'user' ? '## User' : '## Assistant'
      markdown += `${roleHeader}\n\n${message.content}\n\n`
    }

    return markdown
  }
}
