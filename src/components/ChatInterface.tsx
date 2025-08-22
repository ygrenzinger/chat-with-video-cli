import React from 'react'
import { Text, Box } from 'ink'
import type { ChatMessage, ChatService } from '../services/chat.service.js'

type ChatInterfaceProps = {
  transcript: string
  chatService: ChatService
  onExit: () => void
  messages?: ChatMessage[]
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages = []
}) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="green" bold>
          🤖 Chat Mode
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">
          You can now ask questions about the video transcript
        </Text>
      </Box>

      {messages.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          {messages.map(message => (
            <Box key={message.id} marginBottom={1}>
              <Text color={message.role === 'user' ? 'blue' : 'green'}>
                {message.role === 'user' ? '👤 You: ' : '🤖 Assistant: '}
                {message.content}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Box>
        <Text color="cyan">Type your question and press Enter...</Text>
      </Box>
    </Box>
  )
}
