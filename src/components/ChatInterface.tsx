import React from 'react'
import { Text, Box } from 'ink'
import type { ChatMessage } from '../services/chat.service.js'
import { MarkdownText } from './MarkdownText.js'

type ChatInterfaceProps = {
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
            <Box key={message.id} marginBottom={1} flexDirection="column">
              <Text color={message.role === 'user' ? 'blue' : 'green'} bold>
                {message.role === 'user' ? '👤 You:' : '🤖 Assistant:'}
              </Text>
              {message.role === 'assistant' ? (
                <Box marginLeft={2}>
                  <MarkdownText>{message.content}</MarkdownText>
                </Box>
              ) : (
                <Box marginLeft={2}>
                  <Text>{message.content}</Text>
                </Box>
              )}
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
