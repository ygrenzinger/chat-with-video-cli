import React, { useMemo } from 'react'
import { Text, Box } from 'ink'
import type { ChatMessage, ChatService } from '../services/chat.service.js'
import type { TerminalConstraints } from '../hooks/useTerminalConstraints.js'

type ChatInterfaceProps = {
  transcript: string
  chatService: ChatService
  onExit: () => void
  messages?: ChatMessage[]
  terminalConstraints: TerminalConstraints
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages = [],
  terminalConstraints
}) => {
  // Calculate visible messages based on terminal height
  const visibleMessages = useMemo(() => {
    const headerLines = 3 // Chat mode header + instructions
    const footerLines = 1 // Prompt line
    const availableLines = terminalConstraints.maxChatHeight - headerLines - footerLines
    
    // Estimate lines per message (role + content, accounting for wrapping)
    const messagesWithEstimatedLines = messages.map(message => {
      const rolePrefix = message.role === 'user' ? '👤 You: ' : '🤖 Assistant: '
      const contentLength = rolePrefix.length + message.content.length
      const estimatedLines = Math.ceil(contentLength / terminalConstraints.maxChatWidth) + 1 // +1 for margin
      return { ...message, estimatedLines }
    })
    
    // Take messages from the end that fit within available lines
    let totalLines = 0
    const visibleFromEnd = []
    
    for (let i = messagesWithEstimatedLines.length - 1; i >= 0; i--) {
      const message = messagesWithEstimatedLines[i]
      if (totalLines + message.estimatedLines <= availableLines) {
        totalLines += message.estimatedLines
        visibleFromEnd.unshift(message)
      } else {
        break
      }
    }
    
    return visibleFromEnd
  }, [messages, terminalConstraints])

  return (
    <Box flexDirection="column" height={terminalConstraints.maxChatHeight} overflow="hidden">
      <Box marginBottom={1}>
        <Text color="green" bold>
          🤖 Chat Mode
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray" wrap="truncate">
          You can now ask questions about the video transcript
        </Text>
      </Box>

      <Box flexGrow={1} flexDirection="column" overflow="hidden">
        {visibleMessages.length > 0 ? (
          visibleMessages.map(message => (
            <Box key={message.id} marginBottom={1}>
              <Text 
                color={message.role === 'user' ? 'blue' : 'green'}
                wrap="wrap"
              >
                {message.role === 'user' ? '👤 You: ' : '🤖 Assistant: '}
                {message.content}
              </Text>
            </Box>
          ))
        ) : (
          <Box>
            <Text color="cyan">Type your question and press Enter...</Text>
          </Box>
        )}
        
        {messages.length > visibleMessages.length && (
          <Box marginTop={1}>
            <Text color="gray" dimColor>
              ... ({messages.length - visibleMessages.length} more messages above)
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}
