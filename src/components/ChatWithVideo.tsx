import React, { useState, useEffect } from 'react'
import { Text, Box } from 'ink'
import Spinner from 'ink-spinner'
import { SubtitlesSelection } from './SubtitlesSelection.js'
import { ChatInterface } from './ChatInterface.js'
import { ChatInput } from './ChatInput.js'
import {
  SubtitleDownloadResult,
  SubtitleLanguage,
  SubtitleService
} from '../services/subtitle.js'
import { ChatMessage, ChatService } from '../services/ai.js'
import { parseCommand, isCommand, getHelpText } from '../utils/chat-commands.js'

export type ChatWithVideoState =
  | { status: 'started' }
  | { status: 'subtitle-selected'; selectedSubtitle: SubtitleLanguage }
  | {
      status: 'subtitle-downloaded'
      selectedSubtitle: SubtitleLanguage
      downloadStatus: 'finished'
      downloadResult: SubtitleDownloadResult
    }
  | { status: 'chat-initializing'; transcript: string }
  | { status: 'chat-ready'; transcript: string; chatService: ChatService }
  | {
      status: 'chat-active'
      transcript: string
      chatService: ChatService
      messages: ChatMessage[]
      isStreaming: boolean
    }

type ChatWithVideoEnhancedProps = {
  url: string
  subtitleService: SubtitleService
}

const YoutubeUrlInfo: React.FC<{ url: string }> = ({ url }) => {
  return (
    <Box flexDirection="column">
      <Text color="green">🎥 Processing YouTube video...</Text>
      <Text color="gray">URL: {url}</Text>
    </Box>
  )
}

export const ChatWithVideo: React.FC<ChatWithVideoEnhancedProps> = ({
  url,
  subtitleService
}) => {
  const [chatState, setChatState] = useState<ChatWithVideoState>({
    status: 'started'
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const handleSubtitleSelected = (subtitle: SubtitleLanguage) => {
    setChatState({
      status: 'subtitle-selected',
      selectedSubtitle: subtitle
    })
  }

  const handleCommand = (command: string) => {
    if (
      chatState.status !== 'chat-active' &&
      chatState.status !== 'chat-ready'
    ) {
      return
    }

    const parsedCommand = parseCommand(command)
    if (!parsedCommand) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: command,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    let responseContent = ''
    switch (parsedCommand.type) {
      case 'help':
        responseContent = getHelpText()
        break
      case 'transcript':
        responseContent = `Full Video Transcript:\n\n${chatState.transcript}`
        break
      case 'clear':
        setMessages([])
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

    setMessages(prev => [...prev, assistantMessage])

    // Handle exit command
    if (parsedCommand.type === 'exit') {
      setTimeout(() => process.exit(0), 1000)
    }
  }

  const handleSendMessage = async (message: string) => {
    if (
      chatState.status !== 'chat-active' &&
      chatState.status !== 'chat-ready'
    ) {
      return
    }

    // Check if it's a command
    if (isCommand(message)) {
      handleCommand(message)
      return
    }

    setIsStreaming(true)

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      let assistantContent = ''
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streamingComplete: false
      }

      setMessages(prev => [...prev, assistantMessage])

      for await (const textPart of chatState.chatService.sendMessage(message)) {
        assistantContent += textPart
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: assistantContent }
              : msg
          )
        )
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, streamingComplete: true }
            : msg
        )
      )
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

      setMessages(prev => [...prev.slice(0, -1), errorMessage])
    } finally {
      setIsStreaming(false)
    }
  }

  // Download subtitle when one is selected
  useEffect(() => {
    if (chatState.status === 'subtitle-selected') {
      const downloadSubtitle = async () => {
        const result = await subtitleService.retrieveRawText(
          url,
          chatState.selectedSubtitle
        )

        if (result.success && result.content) {
          setChatState({
            status: 'chat-initializing',
            transcript: result.content
          })
        } else {
          setChatState({
            selectedSubtitle: chatState.selectedSubtitle,
            status: 'subtitle-downloaded',
            downloadStatus: 'finished',
            downloadResult: result
          })
        }
      }
      downloadSubtitle()
    }
  }, [chatState, subtitleService, url])

  // Initialize chat service when transcript is ready
  useEffect(() => {
    if (chatState.status === 'chat-initializing') {
      const initializeChatService = async () => {
        try {
          const chatService = new ChatService(chatState.transcript)
          setChatState({
            status: 'chat-ready',
            transcript: chatState.transcript,
            chatService
          })
        } catch (error) {
          console.error('Failed to initialize chat service:', error)
        }
      }

      initializeChatService()
    }
  }, [chatState])

  // Transition to chat-active when user starts chatting
  useEffect(() => {
    if (chatState.status === 'chat-ready' && messages.length === 0) {
      setChatState({
        status: 'chat-active',
        transcript: chatState.transcript,
        chatService: chatState.chatService,
        messages: [],
        isStreaming: false
      })
    }
  }, [chatState, messages])

  const renderChatState = () => {
    switch (chatState.status) {
      case 'started':
        return (
          <Box flexDirection="column">
            <SubtitlesSelection
              url={url}
              subtitleService={subtitleService}
              onSubtitleSelected={handleSubtitleSelected}
            />
          </Box>
        )

      case 'subtitle-selected':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Selected subtitle:</Text>
            <Text color="cyan">{chatState.selectedSubtitle.name}</Text>
            <Text> </Text>
            <Text color="yellow">
              <Spinner type="dots" /> Downloading subtitle file...
            </Text>
          </Box>
        )

      case 'chat-initializing':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Transcript downloaded successfully!</Text>
            <Text> </Text>
            <Text color="yellow">
              <Spinner type="dots" /> Initializing AI chat service...
            </Text>
          </Box>
        )

      case 'chat-ready':
        return (
          <Box flexDirection="column">
            <Text color="green">🚀 Chat mode ready!</Text>
            <Text color="gray">You can now ask questions about the video.</Text>
            <Text color="gray">Type '/help' for available commands.</Text>
            <Text> </Text>
            <Text color="cyan">
              Type your first question to start chatting...
            </Text>
          </Box>
        )

      case 'chat-active':
        return (
          <Box flexDirection="column">
            <ChatInterface
              transcript={chatState.transcript}
              chatService={chatState.chatService}
              onExit={() => process.exit(0)}
              messages={messages}
            />
            <ChatInput onSubmit={handleSendMessage} disabled={isStreaming} />
          </Box>
        )

      default:
        return <Text color="red">Unknown state</Text>
    }
  }

  return (
    <>
      <YoutubeUrlInfo url={url} />
      {renderChatState()}
    </>
  )
}
