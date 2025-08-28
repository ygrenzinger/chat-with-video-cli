import React, { useEffect } from 'react'
import { Text, Box } from 'ink'
import { SubtitleService, SubtitleLanguage } from '../services/subtitle.js'
import { useChatState } from '../hooks/useChatState.js'
import { useSubtitleDownload } from '../hooks/useSubtitleDownload.js'
import { useChatService } from '../hooks/useChatService.js'
import { useMessageHandling } from '../hooks/useMessageHandling.js'
import { useTerminalConstraints } from '../hooks/useTerminalConstraints.js'
import { ChatStateRenderer } from './ChatStateRenderer.js'
import { ChatWithVideoConfig, mergeConfig } from '../utils/factories.js'

type ChatWithVideoProps = {
  url: string
  subtitleService: SubtitleService
  config?: ChatWithVideoConfig
}

const YoutubeUrlInfo: React.FC<{ url: string }> = ({ url }) => {
  return (
    <Box flexDirection="column">
      <Text color="green">🎥 Processing YouTube video...</Text>
      <Text color="gray">URL: {url}</Text>
    </Box>
  )
}

export const ChatWithVideo: React.FC<ChatWithVideoProps> = ({
  url,
  subtitleService,
  config
}) => {
  const mergedConfig = mergeConfig(config)
  const terminalConstraints = useTerminalConstraints()

  // Initialize hooks
  const {
    chatState,
    transitionToSubtitleSelected,
    transitionToSubtitleDownloaded,
    transitionToChatInitializing,
    transitionToChatReady,
    transitionToChatActive,
    canProcessMessages,
    getCurrentTranscript,
    getCurrentChatService,
    getCurrentVideoName
  } = useChatState()

  // Handle subtitle download
  useSubtitleDownload({
    chatState,
    url,
    subtitleService,
    onDownloadSuccess: transitionToChatInitializing,
    onDownloadError: transitionToSubtitleDownloaded
  })

  // Handle chat service initialization
  useChatService({
    chatState,
    onChatServiceReady: transitionToChatReady,
    onChatServiceError: error => {
      console.error('Failed to initialize chat service:', error)
    },
    createChatService: mergedConfig.chatServiceFactory
  })

  // Handle message processing
  const { messages, isStreaming, handleSendMessage } = useMessageHandling({
    messageHandler: mergedConfig.messageHandlerFactory(
      mergedConfig.exitHandler,
      mergedConfig.timeoutHandler
    ),
    chatService: getCurrentChatService(),
    transcript: getCurrentTranscript(),
    canProcessMessages: canProcessMessages(),
    videoName: getCurrentVideoName()
  })

  // Auto-transition to chat-active when ready and no messages
  useEffect(() => {
    if (
      mergedConfig.enableAutoTransition &&
      chatState.status === 'chat-ready' &&
      messages.length === 0
    ) {
      transitionToChatActive(
        chatState.transcript,
        chatState.chatService,
        chatState.videoName
      )
    }
  }, [
    chatState,
    messages.length,
    mergedConfig.enableAutoTransition,
    transitionToChatActive
  ])

  const handleSubtitleSelected = (subtitle: SubtitleLanguage) => {
    transitionToSubtitleSelected(subtitle)
  }

  const handleExit = () => {
    mergedConfig.exitHandler()
  }

  return (
    <Box 
      flexDirection="column" 
      width={terminalConstraints.width}
      height={terminalConstraints.height}
      overflow="hidden"
    >
      <Box height={terminalConstraints.headerAreaHeight}>
        <YoutubeUrlInfo url={url} />
      </Box>
      <Box flexGrow={1} overflow="hidden">
        <ChatStateRenderer
          url={url}
          chatState={chatState}
          subtitleService={subtitleService}
          messages={messages}
          isStreaming={isStreaming}
          onSubtitleSelected={handleSubtitleSelected}
          onSendMessage={handleSendMessage}
          onExit={handleExit}
          terminalConstraints={terminalConstraints}
        />
      </Box>
    </Box>
  )
}
