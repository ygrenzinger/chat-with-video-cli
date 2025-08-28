import React from 'react'
import { Text, Box } from 'ink'
import Spinner from 'ink-spinner'
import { ChatWithVideoState } from '../hooks/useChatState.js'
import { TerminalConstraints } from '../hooks/useTerminalConstraints.js'
import { SubtitlesSelection } from './SubtitlesSelection.js'
import { ChatInterface } from './ChatInterface.js'
import { ChatInput } from './ChatInput.js'
import { SubtitleLanguage, SubtitleService } from '../services/subtitle.js'
import { ChatMessage } from '../services/chat.service.js'

type ChatStateRendererProps = {
  url: string
  chatState: ChatWithVideoState
  subtitleService: SubtitleService
  messages: ChatMessage[]
  isStreaming: boolean
  terminalConstraints: TerminalConstraints
  onSubtitleSelected: (subtitle: SubtitleLanguage) => void
  onSendMessage: (message: string) => void
  onExit: () => void
}

export const ChatStateRenderer: React.FC<ChatStateRendererProps> = ({
  url,
  chatState,
  subtitleService,
  messages,
  isStreaming,
  terminalConstraints,
  onSubtitleSelected,
  onSendMessage,
  onExit
}) => {
  switch (chatState.status) {
    case 'started':
      return (
        <Box flexDirection="column">
          <SubtitlesSelection
            url={url}
            subtitleService={subtitleService}
            onSubtitleSelected={onSubtitleSelected}
            terminalConstraints={terminalConstraints}
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

    case 'subtitle-downloaded':
      if (chatState.downloadResult.success) {
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Subtitle downloaded successfully!</Text>
          </Box>
        )
      } else {
        return (
          <Box flexDirection="column">
            <Text color="red">❌ Failed to download subtitle:</Text>
            <Text color="red">{chatState.downloadResult.error}</Text>
            <Text> </Text>
            <Text color="yellow">
              Please try selecting a different subtitle.
            </Text>
          </Box>
        )
      }

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
        <Box flexDirection="column" height="100%">
          <Box flexGrow={1} overflow="hidden">
            <ChatInterface
              transcript={chatState.transcript}
              chatService={chatState.chatService}
              onExit={onExit}
              messages={messages}
              terminalConstraints={terminalConstraints}
            />
          </Box>
          <Box height={terminalConstraints.inputAreaHeight}>
            <ChatInput 
              onSubmit={onSendMessage} 
              disabled={isStreaming}
              terminalConstraints={terminalConstraints} 
            />
          </Box>
        </Box>
      )

    default:
      return <Text color="red">Unknown state</Text>
  }
}
