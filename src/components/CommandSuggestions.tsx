import React from 'react'
import { Box, Text } from 'ink'
import type { CommandSuggestion } from '../utils/chat-commands.js'

type CommandSuggestionsProps = {
  suggestions: CommandSuggestion[]
  selectedIndex: number
}

export const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({
  suggestions,
  selectedIndex
}) => {
  if (suggestions.length === 0) {
    return null
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      {suggestions.map((suggestion, index) => {
        const isSelected = index === selectedIndex
        return (
          <Box key={suggestion.command}>
            <Text
              color={isSelected ? 'black' : 'gray'}
              backgroundColor={isSelected ? 'cyan' : undefined}
            >
              {suggestion.command}
            </Text>
            <Text color="gray"> - {suggestion.description}</Text>
          </Box>
        )
      })}
    </Box>
  )
}