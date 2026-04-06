import React, { useEffect } from 'react'
import { Text, Box, useInput } from 'ink'
import Spinner from 'ink-spinner'
import { type StateFrom } from 'xstate'
import { SubtitlesSelection } from './SubtitlesSelection.js'
import { ChatInterface } from './ChatInterface.js'
import { ChatInput } from './ChatInput.js'
import {
  type SubtitleLanguage,
  type SubtitleService
} from '../services/subtitle.js'
import { type ChatMessage } from '../services/chat.service.js'
import { chatWithVideoMachine } from '../machines/chatWithVideo.machine.js'

type ChatStateRendererProps = {
  url: string
  machineState: StateFrom<typeof chatWithVideoMachine>
  subtitleService: SubtitleService
  messages: ChatMessage[]
  isStreaming: boolean
  onSubtitleSelected: (subtitle: SubtitleLanguage) => void
  onRetry: () => void
  onSendMessage: (message: string) => void
  onExit?: () => void
}

export const ChatStateRenderer: React.FC<ChatStateRendererProps> = ({
  url,
  machineState,
  subtitleService,
  messages,
  isStreaming,
  onSubtitleSelected,
  onRetry,
  onSendMessage,
  onExit: _onExit
}) => {
  useEffect(() => {
    if (machineState.matches('chatInitError')) {
      process.exit(1)
    }
  }, [machineState])

  useInput(() => {
    if (machineState.matches('downloadError')) {
      onRetry()
    }
  })

  if (machineState.matches('selectingSubtitle')) {
    return (
      <Box flexDirection="column">
        <SubtitlesSelection
          url={url}
          subtitleService={subtitleService}
          onSubtitleSelected={onSubtitleSelected}
        />
      </Box>
    )
  }

  if (machineState.matches('downloadingSubtitle')) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">
          <Spinner type="dots" /> Downloading subtitle file...
        </Text>
      </Box>
    )
  }

  if (machineState.matches('downloadError')) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Failed to download subtitle:</Text>
        <Text color="red">{machineState.context.error || 'Unknown error'}</Text>
        <Text> </Text>
        <Text color="yellow">Press any key to retry.</Text>
      </Box>
    )
  }

  if (machineState.matches('initializingChat')) {
    return (
      <Box flexDirection="column">
        <Text color="green">✅ Transcript downloaded successfully!</Text>
        <Text> </Text>
        <Text color="yellow">
          <Spinner type="dots" /> Initializing AI chat service...
        </Text>
      </Box>
    )
  }

  if (machineState.matches('chatInitError')) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Failed to initialize AI chat service:</Text>
        <Text color="red">{machineState.context.error || 'Unknown error'}</Text>
      </Box>
    )
  }

  if (machineState.matches('chatReady')) {
    return (
      <Box flexDirection="column">
        <Text color="green">🚀 Chat mode ready!</Text>
        <Text color="gray">You can now ask questions about the video.</Text>
        <Text color="gray">Type '/help' for available commands.</Text>
        <Text> </Text>
        <Text color="cyan">Type your first question to start chatting...</Text>
      </Box>
    )
  }

  if (machineState.matches('chatActive')) {
    return (
      <Box flexDirection="column">
        <ChatInterface messages={messages} />
        <ChatInput onSubmit={onSendMessage} disabled={isStreaming} />
      </Box>
    )
  }

  return <Text color="red">Unknown state</Text>
}
