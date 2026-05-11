import React from 'react'
import { Text, Box } from 'ink'
import {
  type SubtitleService,
  type SubtitleLanguage
} from '../services/subtitle.js'
import { useChatMachine } from '../hooks/useChatMachine.js'
import { useMessageHandling } from '../hooks/useMessageHandling.js'
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

  const createConfiguredChatService = (videoUrl: string, transcript: string) =>
    mergedConfig.chatServiceFactory(
      videoUrl,
      transcript,
      mergedConfig.modelConfig
    )

  const { state, send, context } = useChatMachine(
    url,
    subtitleService,
    createConfiguredChatService
  )

  // Handle message processing
  const { messages, isStreaming, handleSendMessage } = useMessageHandling({
    messageHandler: mergedConfig.messageHandlerFactory(
      mergedConfig.exitHandler,
      mergedConfig.timeoutHandler
    ),
    chatService: context.chatService,
    transcript: context.transcript,
    canProcessMessages: state.matches('chatActive'),
    videoName: context.videoName
  })

  const handleSubtitleSelected = (subtitle: SubtitleLanguage) => {
    send({ type: 'SELECT_SUBTITLE', subtitle })
  }

  const handleRetry = () => {
    send({ type: 'RETRY' })
  }

  const handleExit = () => {
    mergedConfig.exitHandler()
  }

  return (
    <>
      <YoutubeUrlInfo url={url} />
      <ChatStateRenderer
        url={url}
        machineState={state}
        subtitleService={subtitleService}
        messages={messages}
        isStreaming={isStreaming}
        onSubtitleSelected={handleSubtitleSelected}
        onRetry={handleRetry}
        onSendMessage={handleSendMessage}
        onExit={handleExit}
      />
    </>
  )
}
